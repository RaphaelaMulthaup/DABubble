import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collectionData,
  collection,
  doc,
  updateDoc,
  addDoc,
  docData,
  query,
  where,
  arrayRemove,
  arrayUnion
} from '@angular/fire/firestore';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { ChannelInterface } from '../shared/models/channel.interface';
import { Router } from '@angular/router';
import { OverlayService } from './overlay.service';

@Injectable({
  providedIn: 'root',
})
export class ChannelsService {
  // Inject Firestore instance
  private firestore = inject(Firestore);
  // Inject Authentication service
  private authService = inject(AuthService);
  private router = inject(Router);
  private overlayService = inject(OverlayService);

  // // Do we really ever need all channels?
  // getAllChannels(): Observable<ChannelInterface[]> {
  //   const channelCollection = collection(this.firestore, 'channels');
  //   return collectionData(channelCollection, { idField: 'id' }).pipe(
  //     map((channels) => channels.filter((channel) => !channel['deleted']))
  //   ) as Observable<ChannelInterface[]>;
  // }

  getCurrentChannel(channelId: string): Observable<ChannelInterface | undefined> {
    const channelRef = doc(this.firestore, `channels/${channelId}`);
    return docData(channelRef, { idField: 'id' }) as Observable<ChannelInterface | undefined>;
  }

  /**
   * Retrieves channels that the current user is a member of and not deleted
   * @returns Observable list of the current user's channels
   */
  getCurrentUserChannels(): Observable<ChannelInterface[]> {
    const channelCollection = collection(this.firestore, 'channels');
    return collectionData(channelCollection, { idField: 'id' }).pipe(
      map((channels) =>
        channels.filter(
          (channel) =>
            !channel['deleted'] &&
            channel['memberIds']?.includes(this.authService.getCurrentUserId())
        )
      )
    ) as Observable<ChannelInterface[]>;
  }

  /**
   * Retrieves all channels that are marked as deleted
   * @returns Observable list of deleted channels
   */
  getAllDeletedChannels(): Observable<ChannelInterface[]> {
    const channelCollection = collection(this.firestore, 'channels');
    return collectionData(channelCollection, { idField: 'id' }).pipe(
      map((channels) => channels.filter((channel) => channel['deleted']))
    ) as Observable<ChannelInterface[]>;
  }

  /**
   * Creates a new channel with the current user as the creator and first member
   * @param name Name of the channel
   * @param description Optional description of the channel
   * @returns Observable that completes when the channel is created
   */
  createChannel(name: string, description?: string): Observable<void> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not logged in');
    const channelData: ChannelInterface = {
      createdBy: user.uid,
      description: '',
      memberIds: [user.uid],
      name,
      deleted: false,
      createdAt: new Date(),
    };
    const channelsCollection = collection(this.firestore, 'channels');
    const promise = addDoc(channelsCollection, channelData).then(() => { });
    return from(promise);
  }

  /**
   * Marks a channel as deleted
   * @param channelId ID of the channel to delete
   * @returns Observable that completes when the channel is marked deleted
   */
  deleteChannel(channelId: string): Observable<void> {
    const channelDocRef = doc(this.firestore, `channels/${channelId}`);
    const promise = updateDoc(channelDocRef, { deleted: true });
    this.router.navigate(["/dashboard"]);
    this.overlayService.close();
    return from(promise);
  }



  /**
   * 🔹 Removes the current user from a channel's member list.
   *
   * Uses Firestore's `arrayRemove` function to remove the given `currentUserId`
   * from the `memberIds` array in the specified channel document.
   * Other members in the array remain unaffected.
   *
   * After the update is complete, the user is redirected to the dashboard.
   *
   * @param channelId - The unique ID of the channel (document ID).
   * @param currentUserId - The ID of the user to be removed from the channel.
   * @returns Promise<void> - Resolves once the update operation is complete.
   *
   * @example
   * await this.leaveChannel("123abc", "user_456");
   * // -> "user_456" will be removed from the channel's memberIds array.
   */
  async leaveChannel(channelId:string , currentUserId:string){
      const channelDocRef = doc(this.firestore, `channels/${channelId}`);
      await updateDoc(channelDocRef, {memberIds: arrayRemove(currentUserId)});
      this.overlayService.close();
      this.router.navigate(["/dashboard"]);
  }

  /**
   * Restores a previously deleted channel
   * @param channelId ID of the channel to restore
   * @returns Observable that completes when the channel is restored
   */
  addChannel(channelId: string): Observable<void> {
    const channelDocRef = doc(this.firestore, `channels/${channelId}`);
    const promise = updateDoc(channelDocRef, { deleted: false });
    return from(promise);
  }

  async addMemberToChannel(channelId:string, newMembers:string[]){
    const channelDocRef = doc(this.firestore, `channels/${channelId}`);
    await updateDoc(channelDocRef, {memberIds: arrayUnion(...newMembers)});
  }


  
  /**
   * 🔹 Updates the name of an existing channel in the "channels" collection.
   *
   * Updates the `name` field of the specified document.
   * If the document does not exist, Firestore will throw an error.
   * If the `name` field does not exist, it will be created automatically.
   *
   * @param channelId - The unique ID of the channel (document ID).
   * @param newValue - The new value for the `name` field.
   * @returns Promise<void> - Resolves when the update is completed.
   *
   * @example
   * await this.changeChannelName("123abc", "General Chat");
   */
  async changeChannelName(channelId:string, newValue:string){
    const channelDocRef = doc(this.firestore, `channels/${channelId}`);
    await updateDoc(channelDocRef, { name: newValue });
  }
  

    /**
   * 🔹 Updates the description of an existing channel in the "channels" collection.
   *
   * Updates the `description` field of the specified document.
   * If the document does not exist, Firestore will throw an error.
   * If the `description` field does not exist, it will be created automatically.
   *
   * @param channelId - The unique ID of the channel (document ID).
   * @param newValue - The new value for the `description` field.
   * @returns Promise<void> - Resolves when the update is completed.
   *
   * @example
   * await this.changeChannelDescription("123abc", "Channel for project discussions.");
   */
  async changeChannelDescription(channelId:string, newValue:string){
    const channelDocRef = doc(this.firestore, `channels/${channelId}`);
    await updateDoc(channelDocRef, { description: newValue });
  }
}
