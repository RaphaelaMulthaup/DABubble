import { inject, Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
} from '@angular/fire/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';

import {
  Firestore,
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

import { from, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { UserInterface } from '../shared/models/user.interface';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private provider = new GoogleAuthProvider(); // Google Auth provider

  //the data of the user in the registration-process
  userToRegister = {
    displayName: '',
    email: '',
    password: '',
    policyAccepted: false,
    photoURL: '',
  };

  // Reaktives Observable für den aktuellen Firestore User
  currentUser$: Observable<UserInterface | null>;

  // Optional synchroner Zugriff
  private currentUserSnapshot: UserInterface | null = null;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private userService: UserService
  ) {
    // Voll reaktives Observable, das automatisch auf AuthStateChanges reagiert
    this.currentUser$ = new Observable<User | null>((subscriber) =>
      onAuthStateChanged(this.auth, subscriber.next.bind(subscriber))
    ).pipe(
      switchMap((firebaseUser) => {
        this.emptyUserObject(); // Registrierung zurücksetzen
        if (firebaseUser) {
          return this.userService.getUserById(firebaseUser.uid); // Firestore User laden
        } else {
          return of(null); // Kein User eingeloggt
        }
      }),
      tap((user) => (this.currentUserSnapshot = user)), // Snapshot für synchronen Zugriff speichern
      shareReplay(1) // Letzten Wert für neue Subscribers zwischenspeichern
    );
  }

  /*** Synchronously get the current Firestore User ***/
  get currentUser(): UserInterface | null {
    return this.currentUserSnapshot;
  }

  /*** Get current Firebase Auth user ID or null ***/
  getCurrentUserId(): string | null {
    const user = this.auth.currentUser;
    return user ? user.uid : null;
  }

  /*** Create or update Firestore user document ***/
  private async createOrUpdateUserInFirestore(
    user: User,
    authProvider: 'google.com' | 'password',
    displayName?: string
  ) {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // If user document doesn't exist, create it with default data
      const userData: UserInterface = {
        uid: user.uid,
        name: displayName ?? user.displayName ?? '',
        email: user.email ?? '',
        photoUrl: user.photoURL ?? '',
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
  register(): Observable<void> {
    const promise = createUserWithEmailAndPassword(
      this.auth,
      this.userToRegister.email,
      this.userToRegister.password
    ).then(async (response) => {
      const user = response.user;
      await this.createOrUpdateUserInFirestore(
        user,
        'password',
        this.userToRegister.password
      );
      await this.userService.updateUser(user.uid, {
        name: this.userToRegister.displayName,
        photoUrl: this.userToRegister.photoURL,
      });
    });
    return from(promise);
  }

  /**
   * sets the userToRegister-Object to default.
   */
  emptyUserObject() {
    this.userToRegister = {
      displayName: '',
      email: '',
      password: '',
      policyAccepted: false,
      photoURL: '',
    };
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
        await this.createOrUpdateUserInFirestore(response.user, 'password');
      }
    );
    return from(promise);
  }

  /**
   * Logs in a user with Google authentication
   * @returns Observable<void>
   */
  loginWithGoogle(): Observable<void> {
    const auth = getAuth();
    const promise = signInWithPopup(auth, this.provider)
      .then(async (response) => {
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
    return updateDoc(userRef, { active: false }).then(() => signOut(this.auth));
  }

  /**
   *
   * Sends link to firesore mail reset url
   *
   */
  sendPasswordRessetEmail(email: string): Promise<void> {
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
