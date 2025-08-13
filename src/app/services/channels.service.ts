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
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  // Brauchen wir wirklich jemals alle Channels?
  // getAllChannels(): Observable<ChannelInterface[]> {
  //   const channelCollection = collection(this.firestore, 'channels');
  //   return collectionData(channelCollection, { idField: 'id' }).pipe(
  //     map((channels) => channels.filter((channel) => !channel['deleted']))
  //   ) as Observable<ChannelInterface[]>;
  // }

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

  getAllDeletedChannels(): Observable<ChannelInterface[]> {
    const channelCollection = collection(this.firestore, 'channels');
    return collectionData(channelCollection, { idField: 'id' }).pipe(
      map((channels) => channels.filter((channel) => channel['deleted']))
    ) as Observable<ChannelInterface[]>;
  }

  createChannel(name: string, description: string): Observable<void> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not logged in');
    const channelData: ChannelInterface = {
      createdBy: user.uid,
      description,
      memberIds: [user.uid],
      name,
      threadIds: [],
      deleted: false,
      createdAt: new Date(),
    };
    const channelsCollection = collection(this.firestore, 'channels');
    const promise = addDoc(channelsCollection, channelData).then(() => {});
    return from(promise);
  }

  deleteChannel(channelId: string): Observable<void> {
    const channelDocRef = doc(this.firestore, `channels/${channelId}`);
    const promise = updateDoc(channelDocRef, { deleted: true });
    return from(promise);
  }

  addChannel(channelId: string): Observable<void> {
    const channelDocRef = doc(this.firestore, `channels/${channelId}`);
    const promise = updateDoc(channelDocRef, { deleted: false });
    return from(promise);
  }
}
