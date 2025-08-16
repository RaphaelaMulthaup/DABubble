import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  doc,
  docData,
  Firestore,
  serverTimestamp,
  updateDoc,
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
    const chatsRef = collection(this.firestore, 'chats');
    return await addDoc(chatsRef, {
      userIds: [userId1, userId2],
      lastMessageAt: serverTimestamp(),
    });
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

  /**
   * Retrieves all messages from a specific chat
   * @param chatId ID of the chat
   * @returns Observable list of messages
   */
  getMessages(chatId: string) {
    return this.messageService.getMessages<MessageInterface>(
      `chats/${chatId}`,
      'messages'
    );
  }

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
   * Retrieves all reactions for a message
   * @param chatId ID of the chat
   * @param messageId ID of the message
   * @returns Observable list of reactions
   */
  getReactions(chatId: string, messageId: string) {
    return this.messageService.getReactions(
      `chats/${chatId}`,
      'messages',
      messageId
    );
  }
}
