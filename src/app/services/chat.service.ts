import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  doc,
  docData,
  Firestore,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { ChatInterface } from '../shared/models/chat.interface';
import { map, Observable } from 'rxjs';
import { MessageInterface } from '../shared/models/message.interface';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private firestore: Firestore = inject(Firestore);
  private messageService = inject(MessageService);

  /**
   * Creates a new chat between two users
   * @param userId1 ID of the first user
   * @param userId2 ID of the second user
   * @returns The newly created chat document
   */
  async createChat(userId1: string, userId2: string) {
    const chatId = await this.getChatId(userId1, userId2);
    const chatRef = doc(this.firestore, 'chats', chatId);
    await setDoc(chatRef, {}, { merge: true });
  }

  /**
   * Retrieves all chats a specific user is involved in
   * @param userId ID of the user
   * @returns Observable list of chats including their IDs
   */
  getChatsForUser(
    userId: string
  ): Observable<(ChatInterface[] & { id: string })[]> {
    const chatsRef = collection(this.firestore, 'chats');
    return collectionData(chatsRef, { idField: 'id' }).pipe(
      map((chats) => chats.filter((c) => c['userIds'].includes(userId)))
    ) as Observable<(ChatInterface[] & { id: string })[]>;
  }

  /**
   * Retrieves a single chat by its ID
   * @param chatId ID of the chat
   * @returns Observable of the chat object or undefined if not found
   */
  getChatById(chatId: string): Observable<ChatInterface | undefined> {
    const chatRef = doc(this.firestore, `chats/${chatId}`);
    return docData(chatRef, { idField: 'id' }) as Observable<
      ChatInterface | undefined
    >;
  }

  /**
   * Sends a message in a chat and updates the last message timestamp
   * @param chatId ID of the chat
   * @param message Message data (createdAt is set automatically)
   */
  async sendMessage(
    chatId: string,
    message: Omit<MessageInterface, 'createdAt'>
  ) {
    await this.messageService.sendMessage(
      `chats/${chatId}`,
      'messages',
      message
    );

    const chatRef = doc(this.firestore, `chats/${chatId}`);
    await updateDoc(chatRef, { lastMessageAt: serverTimestamp() });
  }

       // Ich denke, dass wir diese Funktion nicht mehr brauchen, weil wir jetzt einen ähnliche in chat-active-router.service nutzten.
            // /**
            //  * Retrieves all messages from a specific chat
            //  * @param chatId ID of the chat
            //  * @returns Observable list of messages
            //  */
            // getMessages(chatId: string) {
            //   return this.messageService.getMessages<MessageInterface>(
            //     `chats/${chatId}`,
            //     'messages'
            //   );
            // }

  /**
   * Adds or removes a reaction to a message
   * @param chatId ID of the chat
   * @param messageId ID of the message
   * @param emojiName Name of the emoji
   * @param userId ID of the user reacting
   */
  toggleReaction(
    chatId: string,
    messageId: string,
    emojiName: string,
    userId: string
  ) {
    return this.messageService.toggleReaction(
      `chats/${chatId}`,
      'messages',
      messageId,
      emojiName,
      userId
    );
  }

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
    const sortedIds = [userId1, userId2].sort();
    return `${sortedIds[0]}_${sortedIds[1]}`;
  }
}
