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

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private firestore: Firestore = inject(Firestore);

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
    const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);
    await addDoc(messagesRef, {
      ...message,
      createdAt: serverTimestamp(),
    });

    // lastMessageAt im Chat updaten
    const chatRef = doc(this.firestore, `chats/${chatId}`);
    await updateDoc(chatRef, { lastMessageAt: serverTimestamp() });
  }

  //Funktion noch nicht genutzt
  /** Nachrichten eines Chats abrufen */
  getMessages(
    chatId: string
  ): Observable<(MessageInterface & { id: string })[]> {
    const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);
    return collectionData(messagesRef, { idField: 'id' }) as Observable<
      (MessageInterface & { id: string })[]
    >;
  }

  //Funktion noch nicht genutzt
  /** Reaktion zu einer Nachricht hinzufügen (oder entfernen) */
  async toggleReaction(
    chatId: string,
    messageId: string,
    emojiName: string,
    userId: string
  ) {
    const reactionRef = doc(
      this.firestore,
      `chats/${chatId}/messages/${messageId}/reactions/${emojiName}`
    );

    // Hole das Dokument mit der Reaction, um zu prüfen, ob userId schon drin ist
    const reactionSnap = await getDoc(reactionRef);

    if (reactionSnap.exists()) {
      const data = reactionSnap.data();
      const users: string[] = data['users'] || [];

      if (users.includes(userId)) {
        // User hat die Reaction schon gesetzt → entfernen
        await updateDoc(reactionRef, {
          users: arrayRemove(userId),
        });
      } else {
        // User hat die Reaction noch nicht → hinzufügen
        await updateDoc(reactionRef, {
          users: arrayUnion(userId),
        });
      }
    } else {
      // Reaktion existiert noch nicht → anlegen mit userId
      await setDoc(reactionRef, {
        emojiName,
        users: [userId],
      });
    }
  }

  //Funktion noch nicht genutzt
  getReactions(chatId: string, messageId: string): Observable<Reaction[]> {
    const reactionsRef = collection(
      this.firestore,
      `chats/${chatId}/messages/${messageId}/reactions`
    );
    return collectionData(reactionsRef, { idField: 'id' }) as Observable<
      Reaction[]
    >;
  }
}
