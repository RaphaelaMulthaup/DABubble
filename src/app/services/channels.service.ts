import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  updateDoc,
  addDoc,
  docData,
  query,
  where,
  arrayRemove,
  getDocs,
  arrayUnion,
  deleteDoc,
  limit,
  getDoc,
} from '@angular/fire/firestore';
import { from, map, Observable, shareReplay, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { ChannelInterface } from '../shared/models/channel.interface';
import { Router } from '@angular/router';
import { OverlayService } from './overlay.service';
import { ScreenService } from './screen.service';

@Injectable({
  providedIn: 'root',
})
export class ChannelsService {
  private channelCache = new Map<string,Observable<ChannelInterface | undefined>>();

  constructor(
    private authService: AuthService,
    private firestore: Firestore,
    private overlayService: OverlayService,
    private router: Router,
    public screenService: ScreenService
  ) {}

  /**
   * Returns a channel observable by ID, optionally in realtime.
   *
   * @param channelId - The ID of the channel.
   * @param realtime - Whether to subscribe to realtime updates.
   */
  getCurrentChannel( channelId: string, realtime: boolean = false): Observable<ChannelInterface | undefined> {
    if (realtime && this.channelCache.has(channelId)) return this.channelCache.get(channelId)!;
    const channel$ = this.fetchChannelFromFirestore(channelId, realtime);
    if (realtime) this.channelCache.set(channelId, channel$);
    return channel$;
  }

  /**
   * Fetches a channel from Firestore, either as a single snapshot or realtime.
   *
   * @param channelId - The ID of the channel.
   * @param realtime - Whether to subscribe to realtime updates.
   */
  fetchChannelFromFirestore(channelId: string, realtime: boolean): Observable<ChannelInterface | undefined> {
    const channelRef = doc(this.firestore, `channels/${channelId}`);
    const source$ = realtime
      ? docData(channelRef, { idField: 'id' })
      : from(getDoc(channelRef)).pipe(map((snap) => snap.exists() ? { id: snap.id, ...snap.data() } : undefined));
    return source$.pipe(
      map((data) => data as ChannelInterface | undefined),
      shareReplay({ bufferSize: 1, refCount: false })
    );
  }

  /**
   * Creates a new channel if the name is available.
   *
   * @param name - Name of the new channel.
   * @param description - Optional description.
   */
  createChannel( name: string, description?: string): Observable<ChannelInterface | undefined> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not logged in');
    const channelRef = collection(this.firestore, 'channels');
    const q = query(channelRef, where('name', '==', name), limit(1));
    return from(getDocs(q)).pipe(
      switchMap((snap) => {
        if (!snap.empty) throw new Error('name vergeben');
        return from(addDoc(channelRef, this.buildChannelData(user.uid, name, description)))
        .pipe(switchMap((docRef) => this.getCurrentChannel(docRef.id)));
      })
    );
  }

  /**
   * Builds a channel object for creation.
   *
   * @param userId - ID of the creator.
   * @param name - Channel name.
   * @param description - Optional description.
   */
  buildChannelData(userId: string, name: string, description?: string): Omit<ChannelInterface, 'id'> {
    return {
      createdBy: userId,
      description: description ?? '',
      memberIds: [userId],
      name,
      createdAt: new Date(),
    };
  }

  /**
   * This function removes a channel and its content from firestore.
   *
   * @param channelId - ID of the channel to delete
   */
  deleteChannel(channelId: string): Observable<void> {
    const channelDocRef = doc(this.firestore, `channels/${channelId}`);
    const promise = deleteDoc(channelDocRef);
    this.channelCache.delete(channelId);
    this.router.navigate(['/dashboard']);
    this.screenService.setDashboardState('sidenav');
    this.overlayService.closeAll();
    return from(promise);
  }

  /**
   * Removes the current user from a channel's member list.
   * After the update is complete, the user is redirected to the dashboard.
   *
   * @param channelId - The unique ID of the channel (document ID).
   * @param currentUserId - The ID of the user to be removed from the channel.
   */
  async leaveChannel(channelId: string, currentUserId: string) {
    const channelDocRef = doc(this.firestore, `channels/${channelId}`);
    await updateDoc(channelDocRef, { memberIds: arrayRemove(currentUserId) });
    this.overlayService.closeAll();
    this.screenService.setDashboardState('sidenav');
    this.router.navigate(['/dashboard']);
  }

  /**
   * Add a new member to a channel.
   *
   * @param channelId - ID of the channel where a new member is added
   * @param newMembers - string[] with membersIds
   */
  async addMemberToChannel(channelId: string, newMembers: string[]) {
    const channelDocRef = doc(this.firestore, `channels/${channelId}`);
    await updateDoc(channelDocRef, { memberIds: arrayUnion(...newMembers) });
  }

  /**
   * Updates the name of an existing channel in the "channels" collection.
   *
   * @param channelId - The unique ID of the channel (document ID).
   * @param newValue - The new channel name.
   */
  async changeChannelName(channelId: string, newValue: string) {
    const channelDocRef = doc(this.firestore, `channels/${channelId}`);
    await updateDoc(channelDocRef, { name: newValue });
  }

  /**
   * Updates the description of an existing channel in the "channels" collection.
   *
   * @param channelId - The unique ID of the channel (document ID).
   * @param newValue - The new channel description.
   */
  async changeChannelDescription(channelId: string, newValue: string) {
    const channelDocRef = doc(this.firestore, `channels/${channelId}`);
    await updateDoc(channelDocRef, { description: newValue });
  }

  /**
   * This function checks, wether a given channel-name does not already exists and returns an boolean-Observable.
   * This prevents the app from having multiple channels with indistinguishable names.
   *
   * @param name - The channel name to be checked
   */
  isChannelNameAvailable (name: string): Observable<boolean> {
    let channelRef = collection(this.firestore, 'channels');
    let q = query(channelRef, where('name', '==', name), limit(1));
    return from(getDocs(q)).pipe(map((snapshot) => snapshot.empty));
  }
}
