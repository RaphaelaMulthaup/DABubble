import { Injectable, inject } from '@angular/core';
import { Firestore, collectionData, collection, doc, updateDoc, arrayUnion, arrayRemove } from '@angular/fire/firestore';
import { UserInterface } from '../shared/models/user.interface';
import { Observable } from 'rxjs';
import { docData } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})

export class UserService {
   private firestore: Firestore = inject(Firestore);


   getAllUsers(): Observable<UserInterface[]> {
    const usersCollection = collection(this.firestore, 'users');
    return collectionData(usersCollection, { idField: 'uid' }) as Observable<UserInterface[]>;
  }

    addContactToUser(userId: string, contactId: string): Promise<void> {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    return updateDoc(userDocRef, {
      contacts: arrayUnion(contactId)
    });
  }
    removeContactFromUser(userId: string, contactId: string): Promise<void> {
      const userDocRef = doc(this.firestore, `users/${userId}`);
      return updateDoc(userDocRef, {
        contacts: arrayRemove(contactId)
      });
    }

  getUserById(uid: string): Observable<UserInterface> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    return docData(userDocRef) as Observable<UserInterface>;
  }
}


