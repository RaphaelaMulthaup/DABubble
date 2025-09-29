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
import { combineLatest, map, Observable, of, shareReplay } from 'rxjs';
import { docData } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  public userCache = new Map<string, Observable<UserInterface>>();

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
  // getUserById(uid: string): Observable<UserInterface> {
  //   if (!this.userCache.has(uid)) {
  //     const userDocRef = doc(this.firestore, `users/${uid}`);
  //     const user$ = docData(userDocRef).pipe(shareReplay(1));
  //     this.userCache.set(uid, user$ as Observable<UserInterface>);
  //   }
  //   return this.userCache.get(uid)!;
  // }

  getUserById(uid: string): Observable<UserInterface> {
    if (!this.userCache.has(uid)) {
      // folosește Firestore din constructor
      const userDocRef = doc(this.firestore, `users/${uid}`);
      const user$ = docData(userDocRef, { idField: 'uid' }).pipe(
        map((doc) => doc as UserInterface),
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this.userCache.set(uid, user$);
    }
    return this.userCache.get(uid)!;
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

  //wird nicht genutzt
  // /**
  //  * Get all email addresses from the 'users' collection.
  //  * Creates an Observable of objects containing the 'uid' and 'email' fields.
  //  * This can be subscribed to in components like "confirm-password.ts".
  //  */
  // getAllUserEmails(): Observable<{ uid: string; email: string }[]> {
  //   const userColl = collection(this.firestore, 'users');
  //   return collectionData(userColl).pipe(
  //     map((users: any[]) =>
  //       users.map((user) => ({
  //         uid: user.uid,
  //         email: user.email,
  //       }))
  //     )
  //   );
  // }

  /**
   * Fetches users based on an array of member IDs.
   * @param memberIds - List of user IDs.
   * Returns an Observable of UserInterface for the members.
   */
  // getMembersFromChannel(memberIds: string[]): Observable<UserInterface[]> {
  //   const userColl = collection(this.firestore, 'users');
  //   const q = query(userColl, where('uid', 'in', memberIds)); // Query for users whose UID is in memberIds
  //   return collectionData(q, { idField: 'id' }) as Observable<UserInterface[]>;
  // }

  /**
   * Fetches users from Firestore whose UIDs are included in the provided array of member IDs.
   *
   * Firestore has a limitation on `in` queries: you can only query for up to 10 values at a time.
   * This function automatically splits the `memberIds` array into batches of 10 and queries Firestore
   * for each batch separately, then combines the results into a single Observable emitting an array
   * of `UserInterface`.
   *
   * @param memberIds - Array of user IDs (UIDs) for the members you want to fetch.
   * @returns Observable<UserInterface[]> - Emits an array of `UserInterface` objects corresponding
   *           to the requested member IDs. If `memberIds` is empty, emits an empty array immediately.
   *
   * @example
   * // Example usage:
   * const memberIds = ['uid1', 'uid2', 'uid3'];
   * userService.getMembersFromChannel(memberIds).subscribe(users => {
   *   console.log(users); // Array of UserInterface objects for uid1, uid2, uid3
   * });
   *
   * @note
   * - Handles Firestore's `in` query limitation by batching requests in groups of 10.
   * - Returns a single combined array if multiple batches are required.
   * - Uses `combineLatest` to merge results from multiple batches into a single array.
   */
  getMembersFromChannel(memberIds: string[]): Observable<UserInterface[]> {
    if (memberIds.length === 0) return of([]);
    const batches: Observable<UserInterface[]>[] = [];

    for (let i = 0; i < memberIds.length; i += 10) {
      const batchIds = memberIds.slice(i, i + 10);
      const q = query(
        collection(this.firestore, 'users'),
        where('uid', 'in', batchIds)
      );
      batches.push(
        collectionData(q, { idField: 'uid' }) as Observable<UserInterface[]>
      );
    }

    return batches.length > 1
      ? combineLatest(batches).pipe(map((arrs) => arrs.flat()))
      : batches[0];
  }

  /**
   * Check if Mail-Adress from inputfield is existing in Firebase. If that's the case,
   * returns UID.
   */
  async checkMailAndUid(inputEmail: string): Promise<string | null> {
    let userColl = collection(this.firestore, 'users');
    let mailQuery = query(userColl, where('email', '==', inputEmail));
    let querySnapshot = await getDocs(mailQuery);

    if (!querySnapshot.empty) {
      let userDoc = querySnapshot.docs[0];
      let data = userDoc.data();
      return userDoc.id;
    }
    return null;
  }
}
