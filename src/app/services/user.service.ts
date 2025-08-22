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
import { map, Observable } from 'rxjs';
import { docData } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  // Inject Firestore instance
  private firestore: Firestore = inject(Firestore);

  /** 
   * Fetch all users from the 'users' collection 
   * Returns an Observable of an array of UserInterface
   */
  getAllUsers(): Observable<UserInterface[]> {
    const usersCollection = collection(this.firestore, 'users'); // Reference to 'users' collection
    return collectionData(usersCollection, { idField: 'uid' }) as Observable<
      UserInterface[]
    >;
  }

  /** 
   * Add a contact to a specific user
   * @param userId - ID of the user to update
   * @param contactId - ID of the contact to add
   * @param contactData - Data of the contact (userId and chatId)
   */
  addContactToUser(
    userId: string,
    contactId: string,
    contactData: { userId: string; chatId: string }
  ): Promise<void> {
    const userDocRef = doc(this.firestore, `users/${userId}`); // Reference to the specific user document
    // Set a single field in the 'contacts' subfield
    return updateDoc(userDocRef, {
      [`contacts.${contactId}`]: contactData,
    });
  }

  /** 
   * Remove a contact from a specific user
   * @param userId - ID of the user to update
   * @param contactId - ID of the contact to remove
   */
  removeContactFromUser(userId: string, contactId: string): Promise<void> {
    const userDocRef = doc(this.firestore, `users/${userId}`); // Reference to the specific user document
    return updateDoc(userDocRef, {
      [`contacts.${contactId}`]: deleteField(), // Delete the contact field
    });
  }

  /** 
   * Fetch a single user by UID
   * @param uid - User ID
   * Returns an Observable of UserInterface
   */
  getUserById(uid: string): Observable<UserInterface> {
    const userDocRef = doc(this.firestore, `users/${uid}`); // Reference to the specific user document
    return docData(userDocRef) as Observable<UserInterface>;
  }

  /** 
   * Update or overwrite a user (not currently used)
   * @param userId - User ID
   * @param data - Partial data to update
   */
  async updateUser(userId: string, data: Partial<UserInterface>) {
    const userRef = doc(this.firestore, `users/${userId}`);
    await updateDoc(userRef, { ...data });
  }

  /** 
   * Set online/offline status for a user (not currently used)
   * @param userId - User ID
   * @param isActive - Boolean status
   */
  async setActiveStatus(userId: string, isActive: boolean) {
    const userRef = doc(this.firestore, `users/${userId}`);
    await updateDoc(userRef, {
      active: isActive,
    });
  }


  /**
   * 
   * Get all email-addresses from collection. Creates objects containing "email".
   * Creates an Observable, thats subscribeable in "confirm-password.ts".
   */
  getAllUserEmails(): Observable<{ email: string }[]> {
    const userColl = collection(this.firestore, 'users');
    return collectionData(userColl).pipe(
      map((users: any[]) => 
        users.map(user => ({
          email: user.email
        })))
    );
  }
}
