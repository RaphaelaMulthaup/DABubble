import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
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
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { from, map, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { UserInterface } from '../shared/models/user.interface';
import { UserService } from './user.service';
import { ChatService } from './chat.service';
import { ScreenService } from './screen.service';
import { UserToRegisterInterface } from '../shared/models/user.to.register.interface';

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
    private chatService: ChatService,
    private firestore: Firestore,
    private userService: UserService,
    private screenService: ScreenService
  ) {
    // 🔥 Reaktives Observable mit Absicherung, dass User-Dokument existiert
    this.currentUser$ = new Observable<User | null>((subscriber) =>
      onAuthStateChanged(this.auth, subscriber.next.bind(subscriber))
    ).pipe(
      switchMap((firebaseUser) => {
        if (!firebaseUser) return of(null);

        return from(this.ensureUserDocExists(firebaseUser)).pipe(
          // Sobald das Doc existiert, reaktiv auf Änderungen hören
          switchMap(() => this.userService.getUserById(firebaseUser.uid))
        );
      }),
      tap((user) => (this.currentUserSnapshot = user)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
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
    let snap = await getDoc(userRef);

    if (!snap.exists()) {
      await this.createOrUpdateUserInFirestore(
        user,
        (user.providerData[0]?.providerId as any) ?? 'password'
      );

      // Optional: kleine Verzögerung, um Firestore-Propagation abzuwarten
      await new Promise((res) => setTimeout(res, 150));
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
      createUserWithEmailAndPassword(this.auth, userData.email, userData.password)
    ).pipe(
      switchMap(async (response) => {
        const user = response.user;
        await this.createOrUpdateUserInFirestore(
          user,
          'password',
          userData.displayName,
          userData.photoURL || undefined
        );
      }),
      map(() => void 0)
    );
  }

  /** Login with email/password */
  login(email: string, password: string): Observable<void> {
    const promise = signInWithEmailAndPassword(this.auth, email, password).then(
      async (response) => {
        await this.screenService.setDashboardStateAfterLogin();
        await this.createOrUpdateUserInFirestore(response.user, 'password');
      }
    );
    return from(promise);
  }

  /** Login as guest */
  loginAsGuest(): Observable<void> {
    const promise = signInAnonymously(this.auth)
      .then(async (credential) => {
        await this.screenService.setDashboardStateAfterLogin();
        const user = credential.user;
        await this.createOrUpdateUserInFirestore(user, 'anonymous', 'Guest');
        await this.userService.updateUser(user.uid, {
          photoUrl: './assets/img/no-avatar.svg',
        });
        await this.addDirectChatToTeam(user.uid);
      })
      .catch((error) => console.error('Guest login error:', error));
    return from(promise) as Observable<void>;
  }

  /** Add default chats for guest user */
  async addDirectChatToTeam(userId: string) {
    await this.chatService.createChat(userId, 'XbsVa8YOj8Nd9vztzX1kAQXrc7Z2');
    await this.chatService.createChat(userId, '5lntBSrRRUM9JB5AFE14z7lTE6n1');
    await this.chatService.createChat(userId, 'rUnD1S8sHOgwxvN55MtyuD9iwAD2');
    await this.chatService.createChat(userId, 'NxSyGPn1LkPV3bwLSeW94FPKRzm1');
  }

  /** Login with Google */
  loginWithGoogle(): Observable<void> {
    const auth = getAuth();
    const promise = signInWithPopup(auth, this.provider)
      .then(async (response) => {
        await this.screenService.setDashboardStateAfterLogin();
        const user = response.user;
        await this.createOrUpdateUserInFirestore(user, 'google.com');
      })
      .catch((error) => console.error('Google Login Error:', error));
    return from(promise) as Observable<void>;
  }

  /** Logout and update Firestore */
  logout() {
    const user = this.auth.currentUser;
    if (!user) return signOut(this.auth);

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const isGuest = user.isAnonymous;

    if (isGuest) {
      return deleteDoc(userRef)
        .catch(() => {})
        .then(() => deleteUser(user))
        .catch((err) => console.error('Failed to delete guest user:', err));
    } else {
      return updateDoc(userRef, { active: false }).then(() =>
        signOut(this.auth)
      );
    }
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
