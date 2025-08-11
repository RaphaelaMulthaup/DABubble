import { inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut, User } from '@angular/fire/auth';
import { signInWithEmailAndPassword } from "firebase/auth";
import { from, Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  firebaseAuth = inject(Auth);
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private auth: Auth) {
    onAuthStateChanged(this.auth, user => this.userSubject.next(user));
  }

  register(email: string,  displayName: string, password: string): Observable<void> {
    const promise = createUserWithEmailAndPassword(this.firebaseAuth, email, password)
      .then(response => updateProfile(response.user, { displayName }))
      return from(promise);
  }
  login(email: string, password: string): Observable<void> {
    const promise = signInWithEmailAndPassword(this.auth, email, password)
      .then(response => {
        this.userSubject.next(response.user);
      });
    return from(promise);
  }

  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  logout() {
    return signOut(this.auth);
  }
}


