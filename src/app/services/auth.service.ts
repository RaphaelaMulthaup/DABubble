import { Injectable } from '@angular/core';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from '@angular/fire/auth';
import {
  signInWithEmailAndPassword,
  signInAnonymously,
  deleteUser,
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  Firestore,
  arrayUnion,
  deleteDoc,
  doc,
  docData,
  getDoc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import {
  catchError,
  distinctUntilChanged,
  concatMap,
  from,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
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
  private provider = new GoogleAuthProvider();

  /** Reaktives Observable für den aktuellen Firestore-User */
  public currentUser$: Observable<UserInterface | null>;

  /** Optional synchroner Zugriff */
  private currentUserSnapshot: UserInterface | null = null;
  channelEntwicklerteamDocRef: DocumentReference<DocumentData>;
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private userService: UserService,
    private userDemoSetupService: UserDemoSetupService,
    private resetDemoChannelService: ResetDemoChannelService,
    private screenService: ScreenService
  ) {
    this.currentUser$ = this.initCurrentUserStream();
    // this.setupGuestLogoutOnUnload();
    this.channelEntwicklerteamDocRef = doc(
      this.firestore,
      `channels/nZmkj8G288La1CqafnLP`
    );
  }

  initCurrentUserStream() {
    return authState(this.auth).pipe(
      switchMap((firebaseUser) => this.handleAuthState(firebaseUser)),
      tap((user) => (this.currentUserSnapshot = user)),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

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

  setupGuestLogoutOnUnload() {
      const user = this.auth.currentUser;
      if (!user?.isAnonymous) return;
      try {
        const userRef = doc(this.firestore, `users/${user.uid}`);
        this.logoutGuest(user, userRef);
      } catch (err) {
        console.warn('Guest logout on unload failed:', err);
      }
  }

  /** Synchronously get current Firestore User */
  get currentUser(): UserInterface | null {
    return this.currentUserSnapshot;
  }

  /** Get current Firebase Auth user ID or null */
  getCurrentUserId(): string | null {
    return this.currentUserSnapshot?.uid ?? null;
  }

  /** Ensure Firestore document for user exists */
  async ensureUserDocExists(user: User): Promise<void> {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await this.createOrUpdateUserInFirestore(
        user,
        (user.providerData[0]?.providerId as any) ?? 'password'
      );
    }
  }

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

  async setupDemoEnvironment(uid: string) {
    const userData = await this.getUserData(uid);
    await this.addUserToCorrectChannel(uid, userData.authProvider);
    await this.userDemoSetupService.addDirectChatToTeam(uid);
  }

  private async getUserData(uid: string): Promise<UserInterface> {
    const userRef = doc(this.firestore, `users/${uid}`);
    const snap = await getDoc(userRef);
    return snap.data() as UserInterface;
  }

  private async addUserToCorrectChannel(uid: string, authProvider: string) {
    const ref =
      authProvider === 'anonymous'
        ? this.resetDemoChannelService.channelEntwicklerteamGuestsDocRef
        : this.channelEntwicklerteamDocRef;
    await updateDoc(ref, { memberIds: arrayUnion(uid) });
  }

  async reactivateExistingUser(userRef: DocumentReference) {
    await updateDoc(userRef, { active: true });
  }
  /** Register new user */
  register(userData: UserToRegisterInterface): Observable<void> {
    return this.createUserInAuth(userData).pipe(
      concatMap((user) => this.saveRegisteredUser(user, userData)),
      map(() => void 0)
    );
  }

  createUserInAuth(userData: UserToRegisterInterface): Observable<User> {
    const { email, password } = userData;
    return from(
      createUserWithEmailAndPassword(this.auth, email, password)
    ).pipe(map((res) => res.user));
  }

  saveRegisteredUser(
    user: User,
    data: UserToRegisterInterface
  ): Observable<void> {
    return from(
      this.createOrUpdateUserInFirestore(
        user,
        'password',
        data.displayName,
        data.photoURL || undefined
      )
    ).pipe(map(() => void 0));
  }

  /** Login with email/password */
  login(email: string, password: string): Observable<void> {
    const promise = signInWithEmailAndPassword(this.auth, email, password).then(
      async (response) => {
        await this.screenService.setInitDashboardState();
        await this.createOrUpdateUserInFirestore(response.user, 'password');
      }
    );
    return from(promise);
  }

  /** Login as guest */
  loginAsGuest(): Observable<void> {
    const promise = signInAnonymously(this.auth)
      .then(async (credential) => {
        await this.screenService.setInitDashboardState();
        const guest = credential.user;
        await this.createOrUpdateUserInFirestore(guest, 'anonymous', 'Guest');
        this.userService.updateUser(guest.uid, {
          photoUrl: './assets/img/no-avatar.svg',
        });
      })
      .catch((error) => console.error('Guest login error:', error));
    return from(promise) as Observable<void>;
  }

  /** Login with Google */
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

  /** Logout and update Firestore */
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

  async logoutGuest(user: User, userRef: DocumentReference) {
    await deleteDoc(userRef)
      .catch(() => {})
      .then(() => deleteUser(user))
      .catch((err) => console.error('Failed to delete guest user:', err));
    await this.resetDemoChannelService.resetExampleChannel(user.uid);
    await this.userDemoSetupService.handleGuestsChannels(user.uid);
    await this.userDemoSetupService.deleteChats(user.uid);
  }

  /** Send password reset email */
  sendPasswordResetEmail(email: string): Promise<void> {
    const auth = getAuth();
    return sendPasswordResetEmail(auth, email);
  }

  /** Update user profile picture */
  updateUserPhotoUrl(photoUrl: string): Promise<void> {
    const user = this.auth.currentUser;
    const userRef = doc(this.firestore, `users/${user?.uid}`);
    return updateDoc(userRef, { photoUrl });
  }

  /** Update user name */
  updateUserName(newName: string): Promise<void> {
    const user = this.auth.currentUser;
    const userRef = doc(this.firestore, `users/${user?.uid}`);
    return updateDoc(userRef, { name: newName });
  }
}
