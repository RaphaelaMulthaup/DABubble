import { inject, Injectable } from '@angular/core';
import { doc, docData, Firestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface User {
  userId?: string;
  name: string;          
  email: string;       
  photoURL: string;      
  contacts: string[];   
  authProvider: 'google.com' | 'passwort'; 
  active: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  firestore: Firestore = inject(Firestore);

  /** Holt einen Benutzer anhand der userId */
  getUserById(userId: string): Observable<User | undefined> {
    const userRef = doc(this.firestore, `users/${userId}`);
    return docData(userRef, { idField: 'userId' }) as Observable<User | undefined>;
  }
}
