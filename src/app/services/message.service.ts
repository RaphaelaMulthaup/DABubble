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
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { MessageInterface } from '../shared/models/message.interface';
import { Reaction } from '../shared/models/reaction.interface';
import { ChatInterface } from '../shared/models/chat.interface';

@Injectable({
  providedIn: 'root', // Service is available globally in the application
})
export class MessageService {
  // Inject Firestore instance
  private firestore: Firestore = inject(Firestore);

  // BehaviorSubject holds the current list of messages for the displayed conversation
  private _messagesDisplayedConversation = new BehaviorSubject<
    MessageInterface[]
  >([]);

  // Public observable that other components can subscribe to in order to receive updates
  messagesDisplayedConversation$ =
    this._messagesDisplayedConversation.asObservable();

  /**
   * Sends a message to a given subcollection (e.g. messages of a chat or thread)
   * @param parentPath Path to the parent document (e.g. "chats/{chatId}")
   * @param subcollectionName Name of the subcollection (e.g. "messages")
   * @param message Message object without createdAt (timestamp is added automatically)
   */
  async sendMessage(
    parentPath: string,
    subcollectionName: string,
    message: Omit<MessageInterface, 'createdAt'>
  ) {
    const messagesRef = collection(
      this.firestore,
      `${parentPath}/${subcollectionName}`
    );
    await addDoc(messagesRef, {
      ...message,
      createdAt: serverTimestamp(), // Firestore server timestamp
    });
  }

  /**
   * Fetches messages from a subcollection and listens for real-time updates
   * @returns Observable of messages (including auto-generated document IDs)
   */
  getMessages<T extends MessageInterface>(
    parentPath: string,
    subcollectionName: string
  ): Observable<(T & { id: string })[]> {
    const messagesRef = collection(
      this.firestore,
      `${parentPath}/${subcollectionName}`
    );
    const q = query(messagesRef, orderBy('createdAt', 'asc')); // Order by creation time ascending
    return collectionData(q, { idField: 'id' }) as Observable<
      (T & { id: string })[]
    >;
  }

  /**
   * Toggles a reaction for a given message
   * - If user has already reacted with the emoji, remove them
   * - Otherwise, add them
   * @param messageId ID of the message
   * @param emojiName Emoji identifier (used as document ID in "reactions" subcollection)
   * @param userId ID of the user reacting
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
        // User already reacted → remove their reaction
        await updateDoc(reactionRef, {
          users: arrayRemove(userId),
        });
      } else {
        // User has not reacted → add their reaction
        await updateDoc(reactionRef, {
          users: arrayUnion(userId),
        });
      }
    } else {
      // First reaction with this emoji → create document
      await setDoc(reactionRef, {
        emojiName,
        users: [userId],
      });
    }
  }

  /**
   * Fetches all reactions of a message in real time
   * @returns Observable list of reactions with user IDs
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
    return collectionData(reactionsRef, { idField: 'id' }) as Observable<
      Reaction[]
    >;
  }

  /**
   * Deletes a message from Firestore
   * @param messageId ID of the message
   */
  async deleteMessage(
    parentPath: string,
    subcollectionName: string,
    messageId: string
  ) {
    const messageRef = doc(
      this.firestore,
      `${parentPath}/${subcollectionName}/${messageId}`
    );
    await deleteDoc(messageRef);
  }

  /**
   * Create a new thread and its first message
   * @param channelId - ID of the channel where the thread belongs
   * @param startedBy - User ID of the thread creator
   * @param text - Text content of the first message
   * @param fileUrls - Optional array of file URLs attached to the message
   * @returns the ID of the created thread
   */

  async createMessage(
    channelId: string,
    startedBy: string,
    text: string,
    type: string
  ) {
    if (type === 'channel') {
      const firstMessageId = await this.sendMessage(
        `channels/${channelId}`,
        'messages',
        {
          senderId: startedBy,
          text,
        }
      );
    } else if (type === 'chat') {
    }
    return of([]);
  }

  async createAnswer(
    channelId: string,
    messageId: string,
    senderId: string,
    text: string,
    type: string
  ) {
    if (type === 'channel') {
      const answerRef = collection(
        this.firestore,
        `channels/${channelId}/messages/${messageId}/answers`
      );
      const newAnswer = {
        senderId,
        text,
        createdAt: new Date(),
      };
      return await addDoc(answerRef, newAnswer);
    }
    return of([]);
  }

  //Es kann sein, dass wir das hier gar nicht mehr brauchen, jetzt wo wir Andreis Activated Routs nutzen.
  // /**
  //  * Loads messages for a selected conversation and updates the BehaviorSubject
  //  * Always pushes the latest messages to subscribed components
  //  */
  // async provideMessages(
  //   selectedConversation: ChatInterface,
  //   typeOfConversation: string
  // ) {
  //   let messages: MessageInterface[] = [];
  //   if (selectedConversation.id) {
  //     messages = await this.loadMessages(
  //       selectedConversation.id,
  //       typeOfConversation
  //     );
  //   }
  //   this._messagesDisplayedConversation.next(messages); // Push the current messages
  // }

  //Es kann sein, dass wir das hier gar nicht mehr brauchen, jetzt wo wir Andreis Activated Routs nutzen.
  // /**
  //  * Loads all messages of a conversation once (no real-time updates)
  //  * @returns Promise with messages including their IDs
  //  */
  // async loadMessages(
  //   conversationId: string,
  //   typeOfConversation: string
  // ): Promise<MessageInterface[]> {
  //   const messagesRef = collection(
  //     this.firestore,
  //     `${typeOfConversation}/${conversationId}/messages`
  //   );
  //   const snapshot = await getDocs(messagesRef);
  //   return snapshot.docs.map((d) => ({
  //     id: d.id, // Add Firestore document ID
  //     ...(d.data() as Omit<MessageInterface, 'id'>),
  //   }));
  // }
}
