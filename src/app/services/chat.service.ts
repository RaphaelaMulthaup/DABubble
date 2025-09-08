import { inject, Injectable, signal } from '@angular/core';
import {
  collection,
  collectionSnapshots,
  deleteDoc,
  doc,
  Firestore,
  setDoc,
} from '@angular/fire/firestore';
import { ChatInterface } from '../shared/models/chat.interface';
import { map, Observable } from 'rxjs';
import { MobileDashboardState } from '../shared/types/mobile-dashboard-state.type';
import { Router } from '@angular/router';
import { MobileService } from './mobile.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  constructor(private router: Router, private firestore: Firestore) {}

  /**
   * Creates (or merges) a new chat document between two users in Firestore.
   *
   * The chat ID is generated deterministically using {@link getChatId}, ensuring
   * that there will never be duplicate chats for the same two users.
   *
   * @param userId1 - The ID of the first user.
   * @param userId2 - The ID of the second user.
   * @returns A Promise that resolves once the chat document has been written.
   */
  async createChat(userId1: string, userId2: string) {
    const chatId = await this.getChatId(userId1, userId2);
    const chatRef = doc(this.firestore, 'chats', chatId);

    await setDoc(
      chatRef,
      {
        chatId: chatId, // Store chatId inside the document as well
      },
      { merge: true }
    );
  }

  /**
   * Retrieves all chats in which the specified user participates.
   *
   * The method listens to snapshot updates in the "chats" collection and filters
   * only those chats whose document ID contains the given user ID.
   *
   * @param userId - The ID of the user.
   * @returns An observable emitting an array of chats with their document IDs included.
   */
  getChatsForUser(userId: string): Observable<ChatInterface[]> {
    const chatsRef = collection(this.firestore, 'chats');

    return collectionSnapshots(chatsRef).pipe(
      map((snaps) =>
        snaps
          // Keep only chats whose ID contains the userId
          .filter((snap) => snap.id.includes(userId))
          .map((snap) => {
            const data = snap.data() as Omit<ChatInterface, 'id'>;
            const id = snap.id; // Document ID consisting of both user IDs
            return { id, ...data };
          })
      )
    );
  }

  // currentMobileDashboardState = signal<MobileDashboardState>('sidenav');

  /**
   * Generates a unique chat ID for two users.
   *
   * The chat ID is created by sorting the two user IDs alphabetically
   * and joining them with an underscore. This ensures that the order
   * of user IDs does not affect the resulting chat ID.
   *
   * @param userId1 - The first user's ID.
   * @param userId2 - The second user's ID.
   * @returns A string representing the unique chat ID for the two users.
   */
  async getChatId(userId1: string, userId2: string) {
    //muss in separate Funktion verschoben werden:
    // this.currentMobileDashboardState.set('message-window');

    const sortedIds = [userId1, userId2].sort();
    return `${sortedIds[0]}_${sortedIds[1]}`;
  }

  /**
   * Extracts the other participant's user ID from a chat ID.
   *
   * Given a chat ID in the format "userA_userB" and the current user's ID,
   * this method returns the ID of the other user.
   *
   * @param chatId - The chat ID string (combination of two user IDs).
   * @param currentUserId - The ID of the currently logged-in user.
   * @returns The ID of the other user in the chat.
   */
  getOtherUserId(chatId: string, currentUserId: string): string {
    const [userA, userB] = chatId.split('_');
    return userA === currentUserId ? userB : userA;
  }

  /**
   * Löscht einen Chat anhand der Chat-ID.
   * @param chatId - Die ID des zu löschenden Chats
   * @returns Ein Promise, das resolved, wenn der Chat gelöscht wurde
   */
  deleteChat(chatId: string): Promise<void> {
    const chatRef = doc(this.firestore, 'chats', chatId);
    return deleteDoc(chatRef);
  }

  async navigateToChat(currentUserId: string, otherUserId: string) {
    const chatId = await this.getChatId(currentUserId, otherUserId);
    await this.createChat(currentUserId, otherUserId);
    this.mobileService.setMobileDashboardState('message-window');
    this.router.navigate(['/dashboard', 'chat', chatId]);
  }
}
