import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  arrayUnion,
  collection,
  collectionData,
  doc,
  Firestore,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { MessageInterface } from '../shared/models/message.interface';

@Injectable({
  providedIn: 'root',
})
export class ThreadService {
  private firestore: Firestore = inject(Firestore);

  //Funktion noch nicht benutzt
  // Thread erstellen
  async createThreadWithFirstMessage(
    channelId: string,
    startedBy: string,
    firstMessageText?: string,
    fileUrls?: string[]
  ): Promise<string> {
    // 1. Neuen Thread erstellen
    const threadsRef = collection(this.firestore, 'threads');
    const newThreadRef = await addDoc(threadsRef, {
      channelId,
      startedBy,
    });

    const threadId = newThreadRef.id;

    // 2. Im Channel threadIds updaten
    const channelRef = doc(this.firestore, 'channels', channelId);
    await updateDoc(channelRef, {
      threadIds: arrayUnion(threadId),
    });

    // 3. Erste Nachricht zum Thread hinzufügen
    const messagesRef = collection(
      this.firestore,
      `threads/${threadId}/threadMessages`
    );
    await addDoc(messagesRef, {
      senderId: startedBy,
      text: firstMessageText,
      fileUrl: fileUrls || [],
      createdAt: Timestamp.now(),
    });

    // 4. Thread-ID zurückgeben
    return threadId;
  }

  //Funktion nochnicht benutzt
  // Alle Threads eines Channels holen
  getThreadsForChannel(channelId: string) {
    const threadsRef = collection(this.firestore, 'threads');
    const q = query(threadsRef, where('channelId', '==', channelId));
    return collectionData(q, { idField: 'id' });
  }

  //Funktion noch nicht genutzt
  // ThreadMessage senden
  async sendThreadMessage(threadId: string, message: Partial<MessageInterface>) {
    const messagesRef = collection(
      this.firestore,
      `threads/${threadId}/threadMessages`
    );
    await addDoc(messagesRef, {
      ...message,
      createdAt: Timestamp.now(),
    });
  }

  //Funktion nochnicht genutzt
  // Alle Nachrichten eines Threads holen (sortiert nach createdAt)
  getThreadMessages(threadId: string) {
    const messagesRef = collection(this.firestore, `threads/${threadId}/threadMessages`);
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    return collectionData(q, { idField: 'id' });
  }
}
