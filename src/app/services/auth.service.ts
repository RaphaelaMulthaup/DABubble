import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
  User,
} from '@angular/fire/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';

import { Firestore, doc, setDoc, updateDoc } from '@angular/fire/firestore';

import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

import { from, Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

import { UserInterface } from '../shared/models/user.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  provider = new GoogleAuthProvider();

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private auth: Auth, private firestore: Firestore) {
    onAuthStateChanged(this.auth, (user) => this.userSubject.next(user));
  }

  register(
    email: string,
    displayName: string,
    password: string
  ): Observable<void> {
    const promise = createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    ).then(async (response) => {
      const user = response.user;
      await updateProfile(user, { displayName });
      const userRef = doc(this.firestore, `users/${user.uid}`);
      const userData: UserInterface = {
        uid: user.uid,
        name: displayName,
        email: user.email ?? '',
        photoUrl: user.photoURL ?? '',
        authProvider: 'password',
        active: true,
        contacts: [],
        role: 'user',
      };
      await setDoc(userRef, userData);
      this.userSubject.next(user);
    });
    return from(promise);
  }

  login(email: string, password: string): Observable<void> {
    const promise = signInWithEmailAndPassword(this.auth, email, password).then(
      async (response) => {
        this.userSubject.next(response.user);
        await this.markUserAsActive(response.user.uid, true);
      }
    );
    return from(promise);
  }

  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  logout() {
    const user = this.auth.currentUser;
    if (!user) {
      return signOut(this.auth);
    }
    const userRef = doc(this.firestore, `users/${user.uid}`);
    return updateDoc(userRef, { active: false }).then(() => signOut(this.auth));
  }

  async markUserAsActive(uid: string, active: boolean) {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    await updateDoc(userDocRef, { active });
  }

  loginWithGoogle(): Observable<void> {
    const auth = getAuth();
    const promise = signInWithPopup(auth, this.provider)
      .then((response) => {
        this.userSubject.next(response.user);
        const credential = GoogleAuthProvider.credentialFromResult(response);
      })
      .catch((error) => {
        const credential = GoogleAuthProvider.credentialFromError(error);
      });
    return from(promise) as Observable<void>;
  }
}
