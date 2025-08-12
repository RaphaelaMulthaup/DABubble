import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  collectionData,
  doc,
  docData,
  Firestore,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { ChatInterface } from '../shared/models/chat.interface';
import { map, Observable } from 'rxjs';
import { MessageInterface } from '../shared/models/message.interface';
import { Reaction } from '../shared/models/reaction.interface';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private firestore: Firestore = inject(Firestore);
  private messageService = inject(MessageService);

  //Funktion noch nicht genutzt
  /** Neuen Chat anlegen */
  async createChat(userId1: string, userId2: string) {
    const chatsRef = collection(this.firestore, 'chats');
    return await addDoc(chatsRef, {
      userIds: [userId1, userId2],
      lastMessageAt: serverTimestamp(),
    });
  }

  //Funktion noch nicht genutzt
  /** Alle Chats eines Benutzers laden */
  getChatsForUser(
    userId: string
  ): Observable<(ChatInterface[] & { id: string })[]> {
    const chatsRef = collection(this.firestore, 'chats');
    return collectionData(chatsRef, { idField: 'id' }).pipe(
      map((chats) => chats.filter((c) => c['userIds'].includes(userId)))
    ) as Observable<(ChatInterface[] & { id: string })[]>;
  }

  //Funktion noch nicht genutzt
  /** Einzelnen Chat laden */
  getChatById(chatId: string): Observable<ChatInterface | undefined> {
    const chatRef = doc(this.firestore, `chats/${chatId}`);
    return docData(chatRef, { idField: 'id' }) as Observable<
      ChatInterface | undefined
    >;
  }

  //Funktion noch nicht genutzt
  /** Nachricht senden */
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

  //Funktion noch nicht genutzt
  /** Nachrichten eines Chats abrufen */
  getMessages(chatId: string) {
    return this.messageService.getMessages<MessageInterface>(
      `chats/${chatId}`,
      'messages'
    );
  }
  //Funktion noch nicht genutzt
  /** Reaktion zu einer Nachricht hinzufügen (oder entfernen) */
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

  //Funktion noch nicht genutzt
  getReactions(chatId: string, messageId: string) {
    return this.messageService.getReactions(
      `chats/${chatId}`,
      'messages',
      messageId
    );
  }
}
