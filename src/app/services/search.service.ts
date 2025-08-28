import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Channel {
  id: string;
  name: string;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  chatId?: string;
  channelId?: string;
}

interface Answer extends Message {
  parentMessageId: string;
}

@Injectable({
  providedIn: 'root', // global verfügbar, kein lokales providers-Array
})
export class SearchService {
  users: User[] = [];
  channels: Channel[] = [];
  chatMessages: Message[] = [];
  channelMessages: Message[] = [];
  answers: Answer[] = [];

  constructor(private firestore: Firestore) {} // Firestore über DI

  async loadData() {
    // Users
    const userSnapshot = await getDocs(collection(this.firestore, 'users'));
    this.users = userSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as User)
    );

    // Channels
    const channelSnapshot = await getDocs(
      collection(this.firestore, 'channels')
    );
    this.channels = channelSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Channel)
    );

    // Chats + Messages + Answers
    const chatSnapshot = await getDocs(collection(this.firestore, 'chats'));
    for (const chatDoc of chatSnapshot.docs) {
      const messagesSnap = await getDocs(collection(chatDoc.ref, 'messages'));
      for (const msgDoc of messagesSnap.docs) {
        const msg = {
          id: msgDoc.id,
          chatId: chatDoc.id,
          ...msgDoc.data(),
        } as Message;
        this.chatMessages.push(msg);

        const answersSnap = await getDocs(collection(msgDoc.ref, 'answers'));
        answersSnap.docs.forEach((ansDoc) => {
          this.answers.push({
            id: ansDoc.id,
            parentMessageId: msg.id,
            chatId: chatDoc.id,
            ...ansDoc.data(),
          } as Answer);
        });
      }
    }

    // Channels + Messages + Answers
    for (const channelDoc of channelSnapshot.docs) {
      const messagesSnap = await getDocs(
        collection(channelDoc.ref, 'messages')
      );
      for (const msgDoc of messagesSnap.docs) {
        const msg = {
          id: msgDoc.id,
          channelId: channelDoc.id,
          ...msgDoc.data(),
        } as Message;
        this.channelMessages.push(msg);

        const answersSnap = await getDocs(collection(msgDoc.ref, 'answers'));
        answersSnap.docs.forEach((ansDoc) => {
          this.answers.push({
            id: ansDoc.id,
            parentMessageId: msg.id,
            channelId: channelDoc.id,
            ...ansDoc.data(),
          } as Answer);
        });
      }
    }
  }

  search(
    term: string,
    options?: { users?: boolean; channels?: boolean; messages?: boolean }
  ) {
    term = term.toLowerCase();
    const results: any[] = [];

    if (options?.users ?? true) {
      results.push(
        ...this.users
          .filter(
            (u) =>
              u.name?.toLowerCase().includes(term) ||
              u.email?.toLowerCase().includes(term)
          )
          .map((u) => ({ type: 'user', ...u }))
      );
    }

    if (options?.channels ?? true) {
      results.push(
        ...this.channels
          .filter((c) => c.name?.toLowerCase().includes(term))
          .map((c) => ({ type: 'channel', ...c }))
      );
    }

    if (options?.messages ?? true) {
      results.push(
        ...this.chatMessages
          .filter((m) => m.text?.toLowerCase().includes(term))
          .map((m) => ({ type: 'chatMessage', ...m }))
      );

      results.push(
        ...this.channelMessages
          .filter((m) => m.text?.toLowerCase().includes(term))
          .map((m) => ({ type: 'channelMessage', ...m }))
      );

      results.push(
        ...this.answers
          .filter((a) => a.text?.toLowerCase().includes(term))
          .map((a) => ({ type: 'answer', ...a }))
      );
    }

    return results;
  }
}
