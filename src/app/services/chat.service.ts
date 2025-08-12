import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  doc,
  docData,
  Firestore,
  serverTimestamp,
} from '@angular/fire/firestore';
import { ChatInterface } from '../shared/models/chat.interface';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private firestore: Firestore = inject(Firestore);

  /** Neuen Chat anlegen */
  async createChat(userId1: string, userId2: string) {
    const chatsRef = collection(this.firestore, 'chats');
    return await addDoc(chatsRef, {
      userIds: [userId1, userId2],
      lastMessageAt: serverTimestamp(),
    });
  }

  /** Alle Chats eines Benutzers laden */
  getChatsForUser(
    userId: string
  ): Observable<(ChatInterface[] & { id: string })[]> {
    const chatsRef = collection(this.firestore, 'chats');
    return collectionData(chatsRef, { idField: 'id' }).pipe(
      map((chats) => chats.filter((c) => c['userIds'].includes(userId)))
    ) as Observable<(ChatInterface[] & { id: string })[]>;
  }

  /** Einzelnen Chat laden */
  getChatById(chatId: string): Observable<ChatInterface | undefined> {
    const chatRef = doc(this.firestore, `chats/${chatId}`);
    return docData(chatRef, { idField: 'id' }) as Observable<ChatInterface | undefined>;
  }
}
