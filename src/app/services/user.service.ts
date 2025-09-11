import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collectionData,
  collection,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { UserInterface } from '../shared/models/user.interface';
import { map, Observable } from 'rxjs';
import { docData } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private firestore: Firestore) {}

  // /**
  //  * Fetch all users from the 'users' collection
  //  * Returns an Observable of an array of UserInterface
  //  */
  // getAllUsers(): Observable<UserInterface[]> {
  //   const usersCollection = collection(this.firestore, 'users'); // Reference to 'users' collection
  //   return collectionData(usersCollection, { idField: 'uid' }) as Observable<
  //     UserInterface[]
  //   >;
  // }

  /**
   * Fetch a single user by UID.
   * @param uid - User ID.
   * Returns an Observable of UserInterface.
   */
  getUserById(uid: string): Observable<UserInterface> {
    const userDocRef = doc(this.firestore, `users/${uid}`); // Reference to the specific user document
    return docData(userDocRef) as Observable<UserInterface>;
  }

  /**
   * Update or overwrite a user (not currently used).
   * @param userId - User ID.
   * @param data - Partial data to update.
   */
  async updateUser(userId: string, data: Partial<UserInterface>) {
    const userRef = doc(this.firestore, `users/${userId}`);
    await updateDoc(userRef, { ...data });
  }

  /**
   * Check if a user with the given email already exists in Firestore.
   * @param inputEmail - The email address to check.
   * Returns true if the email already exists, otherwise false.
   */
  async checkForExistingUser(inputEmail: string): Promise<boolean> {
    const usersCollection = collection(this.firestore, 'users'); // Reference to 'users' collection
    const emailQuery = query(usersCollection, where('email', '==', inputEmail));
    const querySnapshot = await getDocs(emailQuery);
    return !querySnapshot.empty; // Returns true when the inputEmail already exists in Firestore
  }

  /**
   * Get all email addresses from the 'users' collection.
   * Creates an Observable of objects containing the 'uid' and 'email' fields.
   * This can be subscribed to in components like "confirm-password.ts".
   */
  getAllUserEmails(): Observable<{ uid: string; email: string }[]> {
    const userColl = collection(this.firestore, 'users');
    return collectionData(userColl).pipe(
      map((users: any[]) =>
        users.map((user) => ({
          uid: user.uid,
          email: user.email,
        }))
      )
    );
  }

  /**
   * Fetches users based on an array of member IDs.
   * @param memberIds - List of user IDs.
   * Returns an Observable of UserInterface for the members.
   */
  getMembersFromChannel(memberIds: string[]): Observable<UserInterface[]> {
    const userColl = collection(this.firestore, 'users');
    const q = query(userColl, where('uid', 'in', memberIds)); // Query for users whose UID is in memberIds
    return collectionData(q, { idField: 'id' }) as Observable<UserInterface[]>;
  }

  /**
   * Check if Mail-Adress from inputfield is existing in Firebase. If that's the case, 
   * returns UID.
   */
  async checkMailAndUid(inputEmail: string): Promise<string | null> {
    let userColl = collection(this.firestore, 'users');
    let mailQuery = query(userColl, where('email', '==', inputEmail));
    let querySnapshot = await getDocs(mailQuery);

    if(!querySnapshot.empty) {
      let userDoc = querySnapshot.docs[0];
      let data = userDoc.data();
      return userDoc.id;
    }
    return null;
  }
}


