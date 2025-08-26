import { inject, Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
  User,
} from '@angular/fire/auth';
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth';

import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';

import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

import { from, Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

import { UserInterface } from '../shared/models/user.interface';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Holds the current user state (null if not logged in)
  private currentUserSubject = new BehaviorSubject<UserInterface | null>(null);
  // Observable stream of the current user
  currentUser$ = this.currentUserSubject.asObservable();

  // Google authentication provider
  provider = new GoogleAuthProvider();

  // BehaviorSubject to hold the current user state
  public userSubject = new BehaviorSubject<User | null>(null);
  // Observable for external components to subscribe to user changes
  user$ = this.userSubject.asObservable();

  // Injected user service for fetching user data
  userService = inject(UserService);

  //the data of the user in the registration-process
  userToRegister = {
    displayName: '',
    email: '',
    password: '',
    policyAccepted: false,
    photoURL: '',
  };

  /**
   * AuthService constructor.
   *
   * Initializes the service by listening to Firebase authentication state changes.
   * When a user is authenticated, their data is loaded from Firestore via `userService`
   * and emitted through `currentUserSubject`. If no user is logged in, `currentUserSubject`
   * is set to null.
   *
   * @param auth - The Firebase Auth instance used for authentication state tracking.
   * @param firestore - The Firestore instance used to fetch user data.
   */
  constructor(private auth: Auth, private firestore: Firestore) {
    // Listen to authentication state changes and update the userSubject
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        // Firestore-User laden
        this.userService.getUserById(user.uid).subscribe((userData) => {
          this.currentUserSubject.next(userData);
        });
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  /**
   * Gets the currently authenticated user.
   *
   * @returns The current user object (`UserInterface`) if logged in, otherwise `null`.
   */
  get currentUser(): UserInterface {
    if (!this.currentUserSubject.value) {
      throw new Error('Kein User eingeloggt!');
    }
    return this.currentUserSubject.value;
  }

  //   /**
  //  * Returns the current logged-in Firebase user
  //  */
  // get currentUser(): User | null {
  //   return this.auth.currentUser;
  // }

  /**
   * Returns the current user's ID or null if no user is logged in
   */
  getCurrentUserId() {
    const user = this.auth.currentUser;
    return user ? user.uid : null;
  }

  /**
   * Creates a new user document in Firestore or updates an existing one
   * @param user Firebase User object
   * @param authProvider Authentication provider ('google.com' or 'password')
   * @param displayName Optional display name for the user
   */
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

  // /**
  //  * Registers a new user with email and password
  //  * @param email User's email
  //  * @param displayName User's display name
  //  * @param password User's password
  //  * @returns Observable<void>
  //  */
  // register(
  //   email: string,
  //   displayName: string,
  //   password: string
  // ): Observable<void> {
  //   const promise = createUserWithEmailAndPassword(
  //     this.auth,
  //     email,
  //     password
  //   ).then(async (response) => {
  //     const user = response.user;
  //     // Update the user's display name in Firebase Auth
  //     await updateProfile(user, { displayName });
  //     // Create or update the user document in Firestore
  //     await this.createOrUpdateUserInFirestore(user, 'password', displayName);
  //     // Update the userSubject with the newly registered user
  //     this.userSubject.next(user);
  //   });
  //   return from(promise);
  // }

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
      //console.log(this.userToRegister.displayName, this.userToRegister.photoURL)
      // await updateProfile(user, { displayName, photoURL });
      // Create or update the user document in Firestore
      await this.createOrUpdateUserInFirestore(
        user,
        'password',
        this.userToRegister.password
      );
      await this.userService.updateUser(user.uid, {
        name: this.userToRegister.displayName,
        photoUrl: this.userToRegister.photoURL,
      });
      // Update the userSubject with the newly registered user
      this.userSubject.next(user);
    });
    return from(promise);
  }

  //!!! Diese Funktion muss nach register ausgeführt werden, aber ich musste sie da entfernen, da es sonst mit dem eintragen von name und photourl nicht geklappt hätte.
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
        // Update the userSubject with the logged-in user
        this.userSubject.next(response.user);
        // Create or update the user document in Firestore
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
        // Update the userSubject with the logged-in Google user
        this.userSubject.next(user);
        // Create or update the user document in Firestore
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

  updateUserPassword(uid: string, newPassword: string): Observable<void> {
    const userRef = doc(this.firestore, `users/${uid}`);
    return new Observable((oberver) => {
      // Nutzer anhand UID im Firebase Auth besorgen (falls authentifiziert),
      // oder Admin-privilegierte Methode verwenden.
      // Für Sicherheitszwecke in Firebase nur mit Admin-Rechten möglich.
      // Beispiel: Falls du admin Zugriff hast, kannst du mit Admin SDK das Passwort setzen.
      // Ohne Admin SDK (z.B. im Client) ist es nicht möglich, das Passwort eines Nutzers
      // direkt zu ändern, wenn du nicht eingeloggt bist.
      // Daher sollte diese Funktion im Backend umgesetzt werden, z.B. mit Cloud Functions.
    });
  }
}
