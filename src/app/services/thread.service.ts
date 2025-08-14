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
import { MessageService } from './message.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThreadService {
  private firestore: Firestore = inject(Firestore);
  private messageService = inject(MessageService);

  //Funktion noch nicht benutzt
  // Thread erstellen
async createThreadWithFirstMessage(channelId: string, startedBy: string, text: string, fileUrls?: string[]) {
  const threadsRef = collection(this.firestore, 'threads');
  
  // Thread-Dokument erstellen
  const newThreadRef = await addDoc(threadsRef, {startedBy });
  const threadId = newThreadRef.id;

  // Erste Nachricht erstellen
  const firstMessageId = await this.messageService.sendMessage(`threads/${threadId}`, 'threadMessages', {
    senderId: startedBy,
    text,
  });

  // Channel-Dokument aktualisieren: neues Thread-Objekt hinzufügen
  const channelRef = doc(this.firestore, `channels/${channelId}`);
  const threadPathId = threadId; // du kannst hier auch einen anderen Key nehmen
  await updateDoc(channelRef, {
    [`threads.${threadPathId}`]: {
      threadId,
      titleMessageId: firstMessageId
    }
  });

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
  async sendThreadMessage(
    threadId: string,
    message: Partial<MessageInterface>
  ) {
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
    return this.messageService.getMessages<MessageInterface>(
      `threads/${threadId}`,
      'threadMessages'
    );
  }

  toggleReaction(threadId: string, messageId: string, emojiName: string, userId: string) {
    return this.messageService.toggleReaction(`threads/${threadId}`, 'threadMessages', messageId, emojiName, userId);
  }

  getReactions(threadId: string, messageId: string) {
    return this.messageService.getReactions(`threads/${threadId}`, 'threadMessages', messageId);
  }

}
