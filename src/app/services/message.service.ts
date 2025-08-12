import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { MessageInterface } from '../shared/models/message.interface';
import { Reaction } from '../shared/models/reaction.interface';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private firestore: Firestore = inject(Firestore);

  /**
   * Sendet eine Nachricht in eine Subcollection
   * @param parentPath z.B. "chats/{chatId}" oder "threads/{threadId}"
   * @param subcollectionName z.B. "messages" oder "threadMessages"
   * @param message Nachrichtendaten (createdAt wird automatisch gesetzt)
   */
  async sendMessage(
    parentPath: string,
    subcollectionName: string,
    message: Omit<MessageInterface, 'createdAt'>
  ) {
    const messagesRef = collection(this.firestore, `${parentPath}/${subcollectionName}`);
    await addDoc(messagesRef, {
      ...message,
      createdAt: serverTimestamp(),
    });
  }

  /**
   * Holt Nachrichten einer Subcollection
   */
  getMessages<T extends MessageInterface>(
    parentPath: string,
    subcollectionName: string
  ): Observable<(T & { id: string })[]> {
    const messagesRef = collection(this.firestore, `${parentPath}/${subcollectionName}`);
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<(T & { id: string })[]>;
  }

  /**
   * Fügt eine Reaktion hinzu oder entfernt sie, falls der User sie schon gesetzt hat
   */
  async toggleReaction(
    parentPath: string,
    subcollectionName: string,
    messageId: string,
    emojiName: string,
    userId: string
  ) {
    const reactionRef = doc(
      this.firestore,
      `${parentPath}/${subcollectionName}/${messageId}/reactions/${emojiName}`
    );

    const reactionSnap = await getDoc(reactionRef);

    if (reactionSnap.exists()) {
      const data = reactionSnap.data();
      const users: string[] = data['users'] || [];

      if (users.includes(userId)) {
        await updateDoc(reactionRef, {
          users: arrayRemove(userId),
        });
      } else {
        await updateDoc(reactionRef, {
          users: arrayUnion(userId),
        });
      }
    } else {
      await setDoc(reactionRef, {
        emojiName,
        users: [userId],
      });
    }
  }

  /**
   * Holt alle Reaktionen einer Nachricht
   */
  getReactions(
    parentPath: string,
    subcollectionName: string,
    messageId: string
  ): Observable<Reaction[]> {
    const reactionsRef = collection(
      this.firestore,
      `${parentPath}/${subcollectionName}/${messageId}/reactions`
    );
    return collectionData(reactionsRef, { idField: 'id' }) as Observable<Reaction[]>;
  }

  /**
   * Löscht eine Nachricht
   */
  async deleteMessage(
    parentPath: string,
    subcollectionName: string,
    messageId: string
  ) {
    const messageRef = doc(this.firestore, `${parentPath}/${subcollectionName}/${messageId}`);
    await deleteDoc(messageRef);
  }
}
