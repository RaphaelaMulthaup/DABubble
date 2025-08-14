import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collectionData,
  collection,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
  deleteField,
} from '@angular/fire/firestore';
import { UserInterface } from '../shared/models/user.interface';
import { Observable } from 'rxjs';
import { docData } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private firestore: Firestore = inject(Firestore);

  getAllUsers(): Observable<UserInterface[]> {
    const usersCollection = collection(this.firestore, 'users');
    return collectionData(usersCollection, { idField: 'uid' }) as Observable<
      UserInterface[]
    >;
  }

  addContactToUser(
    userId: string,
    contactId: string,
    contactData: { userId: string; chatId: string }
  ): Promise<void> {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    // einzelnes Feld setzen
    return updateDoc(userDocRef, {
      [`contacts.${contactId}`]: contactData,
    });
  }
  removeContactFromUser(userId: string, contactId: string): Promise<void> {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    return updateDoc(userDocRef, {
      [`contacts.${contactId}`]: deleteField(),
    });
  }
  getUserById(uid: string): Observable<UserInterface> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    return docData(userDocRef) as Observable<UserInterface>;
  }

  //Funktion noch nicht genutzt
  /** Erstellt oder überschreibt einen Benutzer */
  async updateUser(userId: string, data: Partial<UserInterface>) {
    const userRef = doc(this.firestore, `users/${userId}`);
    await updateDoc(userRef, { ...data });
  }

  //Funktion noch nicht genutzt
  /** Online/Offline setzen */
  async setActiveStatus(userId: string, isActive: boolean) {
    const userRef = doc(this.firestore, `users/${userId}`);
    await updateDoc(userRef, {
      active: isActive,
    });
  }
}
