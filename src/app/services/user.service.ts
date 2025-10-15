import { Injectable } from '@angular/core';
import {
  Firestore,
  collectionData,
  collection,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  limit,
} from '@angular/fire/firestore';
import { UserInterface } from '../shared/models/user.interface';
import { combineLatest, map, Observable, of, shareReplay } from 'rxjs';
import { docData } from '@angular/fire/firestore';
import { OverlayService } from './overlay.service';
import { ProfileViewOtherUsersComponent } from '../overlay/profile-view-other-users/profile-view-other-users.component'; // Importing the profile view component for users
import { ProfileViewMainComponent } from '../overlay/profile-view-main/profile-view-main.component';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  public userCache = new Map<string, Observable<UserInterface>>();

  constructor(
    private firestore: Firestore,
    private overlayService: OverlayService
  ) {}

  /**
   * Fetch a single user by UID and returns an Observable of UserInterface.
   *
   * @param userId - the users ID
   */
  getUserById(userId: string): Observable<UserInterface> {
    if (!this.userCache.has(userId)) {
      const userDocRef = doc(this.firestore, `users/${userId}`);
      const user$ = docData(userDocRef, { idField: 'uid' }).pipe(
        map((doc) => doc as UserInterface),
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this.userCache.set(userId, user$);
    }
    return this.userCache.get(userId)!;
  }

  /**
   * Updates a users data.
   *
   * @param userId - the users ID
   * @param data - Partial data to update.
   */
  async updateUser(userId: string, data: Partial<UserInterface>) {
    const userRef = doc(this.firestore, `users/${userId}`);
    await updateDoc(userRef, { ...data });
  }

  /**
   * Checks if a user with the given email exists in Firestore.
   * Returns the user's ID if found, otherwise null.
   *
   * @param inputEmail - The email address to check.
   */
  async getUserIdByEmail(inputEmail: string): Promise<string | null> {
    const usersCollection = collection(this.firestore, 'users');
    const emailQuery = query(
      usersCollection,
      where('email', '==', inputEmail),
      limit(1)
    );
    const querySnapshot = await getDocs(emailQuery);
    if (!querySnapshot.empty) return querySnapshot.docs[0].id;
    return null;
  }

  /**
   * Fetches users from Firestore whose UIDs are included in the provided array of member IDs.
   *
   * @param memberIds - Array of user IDs
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
   * Opens the profile overlay for the selected user.
   * 
   * @param userId - the ID of the user selected
   * @param currentUserId - the ID of the current user
   */
  openProfileOverlay(userId: string, currentUserId: string) {
    if (userId === currentUserId) {
      this.overlayService.openComponent(
        ProfileViewMainComponent,
        'cdk-overlay-dark-backdrop',
        { globalPosition: 'center' }
      );
    } else {
      this.overlayService.openComponent(
        ProfileViewOtherUsersComponent,
        'cdk-overlay-dark-backdrop',
        { globalPosition: 'center' },
        { user$: this.getUserById(userId) }
      );
    }
  }
}
