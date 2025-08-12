import { inject, Injectable } from '@angular/core';
import { addDoc, collection, Firestore, serverTimestamp } from '@angular/fire/firestore';

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
      lastMessageAt: serverTimestamp()
    });
  }
}
