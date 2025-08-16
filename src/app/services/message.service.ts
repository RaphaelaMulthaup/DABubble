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
   * Sends a message to a subcollection
   * @param parentPath e.g. "chats/{chatId}" or "threads/{threadId}"
   * @param subcollectionName e.g. "messages" or "threadMessages"
   * @param message Message data (createdAt is set automatically)
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
   * Fetches messages from a subcollection
   * @returns Observable list of messages including their ID
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
   * Adds or removes a reaction depending on whether the user already reacted
   * @param messageId ID of the message
   * @param emojiName Name of the emoji
   * @param userId ID of the user who reacts
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
   * Fetches all reactions of a message
   * @param messageId ID of the message
   * @returns Observable list of reactions
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
   * Deletes a message
   * @param messageId ID of the message to delete
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
