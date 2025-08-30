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
} from '@angular/fire/firestore';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { ChannelInterface } from '../shared/models/channel.interface';

@Injectable({
  providedIn: 'root',
})
export class ChannelsService {
  // Inject Firestore instance
  private firestore = inject(Firestore);
  // Inject Authentication service
  private authService = inject(AuthService);

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
    return from(promise);
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

  async changeChannelName(channelId:string, newValue:string){
    const channelDocRef = doc(this.firestore, `channels/${channelId}`);
    await updateDoc(channelDocRef, { name: newValue });
  }
  
    async changeChannelDescription(channelId:string, newValue:string){
    const channelDocRef = doc(this.firestore, `channels/${channelId}`);
    await updateDoc(channelDocRef, { description: newValue });
  }
}
