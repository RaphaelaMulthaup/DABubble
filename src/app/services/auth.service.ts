import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
} from '@angular/fire/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { signInAnonymously } from 'firebase/auth';
import { deleteUser } from 'firebase/auth';

import {
  Firestore,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';

import { firstValueFrom, from, map, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { UserInterface } from '../shared/models/user.interface';
import { UserService } from './user.service';
import { ChatService } from './chat.service';
import { ScreenService } from './screen.service';
import { UserToRegisterInterface } from '../shared/models/user.to.register.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private provider = new GoogleAuthProvider(); // Google Auth provider
  // Reaktives Observable für den aktuellen Firestore User
  public currentUser$: Observable<UserInterface | null>;
  // Optional synchroner Zugriff
  private currentUserSnapshot: UserInterface | null = null;

  constructor(
    private auth: Auth,
    private chatService: ChatService,
    private firestore: Firestore,
    private userService: UserService,
    private screenService: ScreenService
  ) {
    // Voll reaktives Observable, das automatisch auf AuthStateChanges reagiert
    this.currentUser$ = new Observable<User | null>((subscriber) =>
      onAuthStateChanged(this.auth, subscriber.next.bind(subscriber))
    ).pipe(
      switchMap(async (firebaseUser) => {
        if (!firebaseUser) return null;

        // 🧠 Schritt 1: Warten bis das Firestore-Doc existiert
        let snap = await getDoc(
          doc(this.firestore, `users/${firebaseUser.uid}`)
        );

        // Wenn es noch nicht existiert (z. B. direkt nach Registrierung), kurz warten und nochmal prüfen
        let retries = 0;
        while (!snap.exists() && retries < 10) {
          await new Promise((res) => setTimeout(res, 100)); // 100ms warten
          snap = await getDoc(doc(this.firestore, `users/${firebaseUser.uid}`));
          retries++;
        }

        // 🧠 Schritt 2: Daten zurückgeben
        return snap.exists() ? (snap.data() as UserInterface) : null;
      }),
      tap((user) => (this.currentUserSnapshot = user)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /*** Synchronously get the current Firestore User ***/
  get currentUser(): UserInterface | null {
    return this.currentUserSnapshot;
  }

  /*** Get current Firebase Auth user ID or null ***/
  getCurrentUserId(): string | null {
    return this.currentUserSnapshot?.uid ?? null;
  }

  /*** Create or update Firestore user document ***/
  private async createOrUpdateUserInFirestore(
    user: User,
    authProvider: 'google.com' | 'password' | 'anonymous',
    displayName?: string,
    photoURL?: string
  ) {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // If user document doesn't exist, create it with default data
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
      // If user exists, just update the active status
      await updateDoc(userRef, { active: true });
    }
  }

  /**
   * Registers a new user with name, email, password and avatar
   */
  register(userData: UserToRegisterInterface): Observable<void> {
    return from(
      createUserWithEmailAndPassword(
        this.auth,
        userData.email,
        userData.password
      )
    ).pipe(
      switchMap(async (response) => {
        const user = response.user;

        // 🧠 hier photoURL mitgeben!
        await this.createOrUpdateUserInFirestore(
          user,
          'password',
          userData.displayName,
          userData.photoURL || undefined
        );

        this.currentUserSnapshot = await firstValueFrom(
          this.userService.getUserById(user.uid)
        );
      }),
      map(() => void 0)
    );
  }
  /**
   * Logs in a user with email and password
   * @param email User's email
   * @param password User's password
   * @returns Observable<void>
   */
  login(email: string, password: string): Observable<void> {
    const promise = signInWithEmailAndPassword(this.auth, email, password).then(
      async (response) => {
        await this.screenService.setDashboardStateAfterLogin();
        await this.createOrUpdateUserInFirestore(response.user, 'password');
      }
    );
    return from(promise);
  }

  loginAsGuest(): Observable<void> {
    const promise = signInAnonymously(this.auth)
      .then(async (credential) => {
        await this.screenService.setDashboardStateAfterLogin();
        const user = credential.user;
        await this.createOrUpdateUserInFirestore(user, 'anonymous', 'Guest');
        await this.userService.updateUser(user.uid, {
          photoUrl: `./assets/img/no-avatar.svg`,
        });
        await this.addDirectChatToTeam(user.uid);
      })
      .catch((error) => {
        console.error('Guest login error:', error);
      });
    return from(promise) as Observable<void>;
  }

  async addDirectChatToTeam(userId: string) {
    await this.chatService.createChat(userId, 'XbsVa8YOj8Nd9vztzX1kAQXrc7Z2');
    await this.chatService.createChat(userId, '5lntBSrRRUM9JB5AFE14z7lTE6n1');
    await this.chatService.createChat(userId, 'rUnD1S8sHOgwxvN55MtyuD9iwAD2');
    await this.chatService.createChat(userId, 'NxSyGPn1LkPV3bwLSeW94FPKRzm1');
  }

  /**
   * Logs in a user with Google authentication
   * @returns Observable<void>
   */
  loginWithGoogle(): Observable<void> {
    const auth = getAuth();
    const promise = signInWithPopup(auth, this.provider)
      .then(async (response) => {
        await this.screenService.setDashboardStateAfterLogin();
        const user = response.user;
        await this.createOrUpdateUserInFirestore(user, 'google.com');
      })
      .catch((error) => {
        console.error('Google Login Error:', error);
      });
    return from(promise) as Observable<void>;
  }

  /**
   * Logs out the current user and updates Firestore to mark the user as inactive
   */
  logout() {
    const user = this.auth.currentUser;
    if (!user) {
      return signOut(this.auth);
    }
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const isGuest = user.isAnonymous;

    if (isGuest) {
      return deleteDoc(userRef)
        .catch(() => {})
        .then(() => {
          return deleteUser(user);
        })
        .catch((err) => console.error('Failed to delete guest user:', err));
    } else {
      return updateDoc(userRef, { active: false }).then(() =>
        signOut(this.auth)
      );
    }
  }

  /**
   *
   * Sends link to firesore mail reset url
   *
   */
  sendPasswordResetEmail(email: string): Promise<void> {
    const auth = getAuth();
    return sendPasswordResetEmail(auth, email);
  }

  /**
   *
   * funktion to save new user image
   *
   */
  updateUserPhotoUrl(photoUrl: string): Promise<void> {
    const user = this.auth.currentUser;
    const userRef = doc(this.firestore, `users/${user?.uid}`);
    return updateDoc(userRef, { photoUrl });
  }

  /**
   *
   * funstion to save new Username
   *
   */
  updateUserName(newName: string): Promise<void> {
    const user = this.auth.currentUser;
    const userRef = doc(this.firestore, `users/${user?.uid}`);
    return updateDoc(userRef, { name: newName });
  }
}
