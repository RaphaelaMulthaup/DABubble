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
import { DocumentReference } from 'firebase/firestore';
import { UserDemoSetupService } from './user-demo-setup.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private provider = new GoogleAuthProvider();

  /** Reaktives Observable für den aktuellen Firestore-User */
  public currentUser$: Observable<UserInterface | null>;

  /** Optional synchroner Zugriff */
  private currentUserSnapshot: UserInterface | null = null;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private userService: UserService,
    private userDemoSetupService: UserDemoSetupService,
    private screenService: ScreenService
  ) {
    // 🔥 Reaktives Observable mit Absicherung, dass User-Dokument existiert
    this.currentUser$ = authState(this.auth).pipe(
      switchMap((firebaseUser) => {
        if (!firebaseUser) return of(null);

        const userRef = doc(this.firestore, `users/${firebaseUser.uid}`);

        return from(this.ensureUserDocExists(firebaseUser)).pipe(
          // falls ensureUserDocExists fehlschlägt, fangen wir den Fehler ab
          // und geben null zurück, anstatt den Stream sterben zu lassen
          catchError((err) => {
            console.error('ensureUserDocExists failed', err);
            return of(void 0);
          }),
          switchMap(() => docData(userRef) as Observable<UserInterface | null>),
          // wenn docData mal undefined liefert, setzen wir explizit null
          map((data) => data ?? null)
        );
      }),
      tap((user) => (this.currentUserSnapshot = user)),
      // optional: nur dann neu emitten wenn sich die uid ändert
      distinctUntilChanged((a, b) => a?.uid === b?.uid),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    window.addEventListener('beforeunload', () => {
      const user = this.auth.currentUser;
      if (user?.isAnonymous) {
        try {
          const userRef = doc(this.firestore, `users/${user.uid}`);
          this.logoutGuest(user, userRef);
        } catch (err) {
          console.warn('Guest logout on unload failed:', err);
        }
      }
    });
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
  private async ensureUserDocExists(user: User): Promise<void> {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await this.createOrUpdateUserInFirestore(
        user,
        (user.providerData[0]?.providerId as any) ?? 'password'
      );
    }
  }

  /** Create or update Firestore user document */
  private async createOrUpdateUserInFirestore(
    user: User,
    authProvider: 'google.com' | 'password' | 'anonymous',
    displayName?: string,
    photoURL?: string
  ) {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const userData: UserInterface = {
        uid: user.uid,
        name: displayName ?? user.displayName ?? '',
        email: user.email ?? '',
        photoUrl: photoURL ?? user.photoURL ?? '',
        authProvider,
        contacts: {},
        active: true,
        role: 'user',
      };
      await setDoc(userRef, userData);
    } else {
      await updateDoc(userRef, { active: true });
    }
  }

  /** Register new user */
  register(userData: UserToRegisterInterface): Observable<void> {
    return from(
      createUserWithEmailAndPassword(
        this.auth,
        userData.email,
        userData.password
      )
    ).pipe(
      concatMap((response) =>
        from(
          this.createOrUpdateUserInFirestore(
            response.user,
            'password',
            userData.displayName,
            userData.photoURL || undefined
          )
        )
      ),
      map(() => void 0)
    );
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
        void Promise.allSettled([
          this.userService.updateUser(guest.uid, {
            photoUrl: './assets/img/no-avatar.svg',
          }),
          this.userDemoSetupService.addDirectChatToTeam(guest.uid),
          updateDoc(this.userDemoSetupService.channelEntwicklerteamDocRef, {
            memberIds: arrayUnion(guest.uid),
          }),
        ]);
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
    await this.userDemoSetupService.resetExampleChannel(user.uid);
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
