import { Injectable, inject } from '@angular/core';
import { Firestore, collectionData, collection, doc, docData, updateDoc, arrayUnion, arrayRemove, addDoc, DocumentData, DocumentReference } from '@angular/fire/firestore';
import { UserInterface } from '../shared/models/user.interface';
import { from, Observable, from as rxFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ChannelInterface } from '../shared/models/channel.interface';

@Injectable({
  providedIn: 'root'
})
export class ChannelsService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);



   getAllChannels(): Observable<ChannelInterface[]> {
    const channelCollection = collection(this.firestore, 'channels');
    return collectionData(channelCollection, { idField: 'uid' }) as Observable<ChannelInterface[]>;
  }

  createChannel(name:string, description:string): Observable<void>  {
    const user = this.authService.currentUser;
     if (!user) throw new Error('User not logged in');
    const channelData: ChannelInterface = {
      createdBy: user.uid,
      description,
      memberIds: [user.uid],
      name,
      threadIds: [],
      deleted: false,
      createdAt: new Date()
    }
    const channelsCollection = collection(this.firestore, 'channels');
    const promise = addDoc(channelsCollection, channelData).then(() => {});
    return from(promise);
  }
  
  deleteChannel(channelId: string): Observable<void> {
    const channelDocRef = doc(this.firestore, `channels/${channelId}`);
    const promise = updateDoc(channelDocRef, { deleted: true });
    return from(promise);
  }


}


