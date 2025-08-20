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
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThreadService {
  // Inject Firestore instance
  private firestore: Firestore = inject(Firestore);
  // Inject MessageService instance to handle messages
  private messageService = inject(MessageService);

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
    type: string,
    id: string
  ) {
    console.log(`id ${id} and type ${type}`);
    if (type === 'channel') {
      const firstMessageId = await this.messageService.sendMessage(
        `channels/${id}`,
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
  
  async createThreadMessage(
  channelId: string,
  messageId: string,
  senderId: string,
  text: string
) {
  const threadRef = collection(
    this.firestore,
    `channels/${channelId}/messages/${messageId}/messages`
  );
  const newThreadMessage = {
    senderId,
    text,
    createdAt: new Date()
  };
  return await addDoc(threadRef, newThreadMessage);
}


  // async createThreadWithFirstMessage(channelId: string, startedBy: string, text: string, fileUrls?: string[]) {
  //   const threadsRef = collection(this.firestore, 'threads'); // Reference to 'threads' collection

  //   // Create a new thread document
  //   const newThreadRef = await addDoc(threadsRef, { startedBy });
  //   const threadId = newThreadRef.id; // ID of the newly created thread

  //   // Create the first message in the thread
  //   const firstMessageId = await this.messageService.sendMessage(`threads/${threadId}`, 'threadMessages', {
  //     senderId: startedBy,
  //     text
  //   });

  //   // Update the channel document to add the new thread object
  //   const channelRef = doc(this.firestore, `channels/${channelId}`);
  //   const threadPathId = threadId; // Key to store in channel threads
  //   await updateDoc(channelRef, {
  //     [`threads.${threadPathId}`]: {
  //       threadId,
  //       titleMessageId: firstMessageId // Store the ID of the first message
  //     }
  //   });

  //   return threadId; // Return the created thread ID
  // }

  /**
   * Fetch all threads for a specific channel
   * @param channelId - ID of the channel
   * @returns Observable of thread documents
   */
  getThreadsForChannel(channelId: string) {
    const threadsRef = collection(this.firestore, 'threads'); // Reference to 'threads' collection
    const q = query(threadsRef, where('channelId', '==', channelId)); // Query threads by channelId
    return collectionData(q, { idField: 'id' }); // Return observable with thread data
  }

  /**
   * Send a message in a specific thread
   * @param threadId - ID of the thread
   * @param message - Message data (partial)
   */
  async sendThreadMessage(
    threadId: string,
    message: Partial<MessageInterface>
  ) {
    const messagesRef = collection(
      this.firestore,
      `threads/${threadId}/messages` // Reference to messages subcollection
    );
    await addDoc(messagesRef, {
      ...message,
      createdAt: Timestamp.now(), // Add creation timestamp
    });
  }

  /**
   * Get all messages of a thread (ordered by creation time)
   * @param threadId - ID of the thread
   * @returns Observable of messages
   */
  getThreadMessages(threadId: string) {
    return this.messageService.getMessages<MessageInterface>(
      `threads/${threadId}`,
      'messages'
    );
  }

  /**
   * Toggle a reaction (like emoji) for a specific message in a thread
   * @param threadId - ID of the thread
   * @param messageId - ID of the message
   * @param emojiName - Name of the emoji
   * @param userId - User ID performing the reaction
   */
  toggleReaction(
    threadId: string,
    messageId: string,
    emojiName: string,
    userId: string
  ) {
    return this.messageService.toggleReaction(
      `threads/${threadId}`,
      'messages',
      messageId,
      emojiName,
      userId
    );
  }

  /**
   * Get all reactions for a specific message in a thread
   * @param threadId - ID of the thread
   * @param messageId - ID of the message
   * @returns Observable of reactions
   */
  getReactions(threadId: string, messageId: string) {
    return this.messageService.getReactions(
      `threads/${threadId}`,
      'messages',
      messageId
    );
  }
}
