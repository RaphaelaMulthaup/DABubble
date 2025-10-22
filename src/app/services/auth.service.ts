import { Injectable } from '@angular/core';
import { Auth, authState, createUserWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { signInWithEmailAndPassword, signInAnonymously, deleteUser, getAuth, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { Firestore, arrayUnion, deleteDoc, doc, docData, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { catchError, distinctUntilChanged, concatMap, from, map, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { UserInterface } from '../shared/models/user.interface';
import { UserService } from './user.service';
import { ScreenService } from './screen.service';
import { UserToRegisterInterface } from '../shared/models/user.to.register.interface';
import { DocumentData, DocumentReference } from 'firebase/firestore';
import { UserDemoSetupService } from './user-demo-setup.service';
import { ResetDemoChannelService } from './reset-demo-channel.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  provider = new GoogleAuthProvider();
  currentUser$: Observable<UserInterface | null>;
  currentUserSnapshot: UserInterface | null = null;
  channelEntwicklerteamDocRef: DocumentReference<DocumentData>;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private resetDemoChannelService: ResetDemoChannelService,
    private screenService: ScreenService,
    private userDemoSetupService: UserDemoSetupService,
    private userService: UserService
  ) {
    this.currentUser$ = this.initCurrentUserStream();
    this.setupGuestLogoutOnUnload();
    this.channelEntwicklerteamDocRef = doc( this.firestore, `channels/nZmkj8G288La1CqafnLP` );
  }

  /**
   * Gets the current authenticated user snapshot.
   */
  get currentUser(): UserInterface | null {
    return this.currentUserSnapshot;
  }

  /**
   * Gets the current user ID or null if not authenticated.
   */
  getCurrentUserId(): string | null {
    return this.currentUserSnapshot?.uid ?? null;
  }

  /**
   * Initializes a reactive stream for the current user based on auth state.
   */
  initCurrentUserStream() {
    return authState(this.auth).pipe(
      switchMap((firebaseUser) => this.handleAuthState(firebaseUser)),
      tap((user) => (this.currentUserSnapshot = user)),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Handles Firebase authentication state changes.
   *
   * @param firebaseUser - The current Firebase user or null
   */
  handleAuthState(firebaseUser: User | null) {
    if (!firebaseUser) return of(null);
    const userRef = doc(this.firestore, `users/${firebaseUser.uid}`);
    return from(this.ensureUserDocExists(firebaseUser)).pipe(
      catchError((err) => {
        console.error('ensureUserDocExists failed', err);
        return of(void 0);
      }),
      switchMap(() => docData(userRef) as Observable<UserInterface | null>),
      map((data) => data ?? null)
    );
  }

  /**
   * Sets up automatic guest logout when the window unloads.
   */
  setupGuestLogoutOnUnload() {
    window.addEventListener('beforeunload', () => {
      const user = this.auth.currentUser;
      if (!user?.isAnonymous) return;
      try {
        const userRef = doc(this.firestore, `users/${user.uid}`);
        this.logoutGuest(user, userRef);
      } catch (err) {
        console.warn('Guest logout on unload failed:', err);
      }
    });
  }
  /**
   * Ensures that a Firestore user document exists for the given Firebase user.
   *
   * @param user - The Firebase user
   */
  async ensureUserDocExists(user: User): Promise<void> {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(userRef);
    if (!snap.exists()) await this.createOrUpdateUserInFirestore( user, (user.providerData[0]?.providerId as any) ?? 'password' );
  }

  /**
   * Creates or updates a user document in Firestore.
   *
   * @param user - The Firebase user
   * @param provider T- he authentication provider used
   * @param name - Optional display name
   * @param photo - Optional photo URL
   */
  async createOrUpdateUserInFirestore(
    user: User,
    provider: 'google.com' | 'password' | 'anonymous',
    name?: string,
    photo?: string
  ) {
    const ref = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(ref);
    snap.exists()
      ? await this.reactivateExistingUser(ref)
      : await this.createNewUser(user, provider, name, photo, ref);
  }

  /**
   * Creates a new user document and sets up demo environment.
   *
   * @param user - The Firebase user
   * @param provider - The authentication provider used
   * @param name - Optional display name
   * @param photo - Optional photo URL
   * @param ref - Optional Firestore document reference
   */
  async createNewUser(
    user: User,
    provider: 'google.com' | 'password' | 'anonymous',
    name?: string,
    photo?: string,
    ref?: DocumentReference
  ) {
    const data = this.buildUserData(user, provider, name, photo);
    await setDoc(ref!, data);
    await this.setupDemoEnvironment(user.uid);
  }

  /**
   * Builds the user data object to store in Firestore.
   *
   * @param user - The Firebase user
   * @param provider - The authentication provider used
   * @param name - Optional display name
   * @param photo - Optional photo URL
   */
  buildUserData(
    user: User,
    provider: 'google.com' | 'password' | 'anonymous',
    name?: string,
    photo?: string
  ): UserInterface {
    return {
      uid: user.uid,
      name: name ?? user.displayName ?? '',
      email: user.email ?? '',
      photoUrl: photo ?? user.photoURL ?? '',
      authProvider: provider,
      contacts: {},
      active: true,
      role: 'user',
    };
  }

  /**
   * Sets up the demo environment for a user.
   *
   * @param uid - The user ID
   */
  async setupDemoEnvironment(uid: string) {
    const userData = await this.getUserData(uid);
    await this.addUserToChannel(uid, userData.authProvider);
    await this.userDemoSetupService.addDirectChatToTeam(uid);
  }

  /**
   * Retrieves user data from Firestore.
   *
   * @param uid - The user ID
   */
  async getUserData(uid: string): Promise<UserInterface> {
    const userRef = doc(this.firestore, `users/${uid}`);
    const snap = await getDoc(userRef);
    return snap.data() as UserInterface;
  }

  /**
   * Adds a user to the correct demo or regular channel.
   *
   * @param uid - The user ID
   * @param authProvider - The authentication provider used
   */
  async addUserToChannel(uid: string, authProvider: string) {
    if (authProvider === 'anonymous') {
      await this.userDemoSetupService.createDemoChannel(uid);
    } else {
      await updateDoc(this.channelEntwicklerteamDocRef, {
        memberIds: arrayUnion(uid),
      });
    }
  }

  /**
   * Reactivates an existing user by setting them active.
   *
   * @param userRef - Firestore document reference for the user
   */
  async reactivateExistingUser(userRef: DocumentReference) {
    await updateDoc(userRef, { active: true });
  }

  /**
   * Registers a new user account.
   *
   * @param userData - The user registration data
   */
  register(userData: UserToRegisterInterface): Observable<void> {
    return this.createUserInAuth(userData).pipe(
      concatMap((user) => this.saveRegisteredUser(user, userData)),
      map(() => void 0)
    );
  }

  /**
   * Creates a new user in Firebase Authentication.
   *
   * @param userData - The user registration data
   */
  createUserInAuth(userData: UserToRegisterInterface): Observable<User> {
    const { email, password } = userData;
    return from(
      createUserWithEmailAndPassword(this.auth, email, password)
    ).pipe(map((res) => res.user));
  }

  /**
   * Saves a registered user's data in Firestore.
   *
   * @param user - The Firebase user
   * @param data - The user registration data
   */
  saveRegisteredUser( user: User, data: UserToRegisterInterface): Observable<void> {
    return from(
      this.createOrUpdateUserInFirestore(
        user,
        'password',
        data.displayName,
        data.photoURL || undefined
      )
    ).pipe(map(() => void 0));
  }

  /**
   * Logs in a user with email and password.
   *
   * @param email - The user's email
   * @param password -  The user's password
   */
  login(email: string, password: string): Observable<void> {
    const promise = signInWithEmailAndPassword(this.auth, email, password).then(
      async (response) => {
        await this.screenService.setInitDashboardState();
        await this.createOrUpdateUserInFirestore(response.user, 'password');
      }
    );
    return from(promise);
  }

  /**
   * Logs in as a guest user.
   */
  loginAsGuest(): Observable<void> {
    const promise = signInAnonymously(this.auth)
      .then(async (credential) => {
        await this.screenService.setInitDashboardState();
        const guest = credential.user;
        await this.createOrUpdateUserInFirestore(guest, 'anonymous', 'Gast');
        this.userService.updateUser(guest.uid, {
          photoUrl: './assets/img/no-avatar.svg',
        });
      })
      .catch((error) => console.error('Guest login error:', error));
    return from(promise) as Observable<void>;
  }

  /**
   * Logs in a user using Google authentication.
   */
  loginWithGoogle(): Observable<void> {
    const auth = getAuth();
    const promise = signInWithPopup(auth, this.provider)
      .then(async (response) => {
        await this.screenService.setInitDashboardState();
        const user = response.user;
        await this.createOrUpdateUserInFirestore(user, 'google.com');
      })
      .catch((error) => console.error('Google Login Error:', error));
    return from(promise) as Observable<void>;
  }

  /**
   * Logs out the current user, deleting guest data if necessary.
   */
  async logout() {
    const user = this.auth.currentUser;
    if (!user) return signOut(this.auth);
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const isGuest = user.isAnonymous;
    if (isGuest) {
      await this.logoutGuest(user, userRef);
    } else {
      await updateDoc(userRef, { active: false });
      await signOut(this.auth);
    }
  }

  /**
   * Logs out and deletes a guest user account.
   *
   * @param user - The guest user
   * @param userRef - Firestore document reference for the user
   */
  async logoutGuest(user: User, userRef: DocumentReference) {
    await deleteDoc(userRef)
      .catch(() => {})
      .then(() => deleteUser(user))
      .catch((err) => console.error('Failed to delete guest user:', err));
    await this.resetDemoChannelService.resetExampleChannel(user.uid);
    await this.userDemoSetupService.handleGuestsChannels(user.uid);
    await this.userDemoSetupService.deleteChats(user.uid);
  }

  /**
   * Sends a password reset email.
   *
   * @param email - The user's email
   */
  sendPasswordResetEmail(email: string): Promise<void> {
    const auth = getAuth();
    return sendPasswordResetEmail(auth, email);
  }

  /**
   * Updates the user's photo URL in Firestore.
   *
   * @param photoUrl - The new photo URL
   */
  updateUserPhotoUrl(photoUrl: string): Promise<void> {
    const user = this.auth.currentUser;
    const userRef = doc(this.firestore, `users/${user?.uid}`);
    return updateDoc(userRef, { photoUrl });
  }

  /**
   * Updates the user's display name in Firestore.
   *
   * @param newName - The new display name
   */
  updateUserName(newName: string): Promise<void> {
    const user = this.auth.currentUser;
    const userRef = doc(this.firestore, `users/${user?.uid}`);
    return updateDoc(userRef, { name: newName });
  }
}