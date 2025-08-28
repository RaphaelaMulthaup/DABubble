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
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { MessageInterface } from '../shared/models/message.interface';
import { ReactionInterface } from '../shared/models/reaction.interface';
import { ChatInterface } from '../shared/models/chat.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root', // Service is available globally in the application
})
export class MessageService {
  // Inject Firestore instance
  private firestore: Firestore = inject(Firestore);
  private authService = inject(AuthService);

  // Holds the current list of messages for the displayed conversation
  private _messagesDisplayedConversation = new BehaviorSubject<
    MessageInterface[]
  >([]);

  // Public observable for components to subscribe to
  messagesDisplayedConversation$ =
    this._messagesDisplayedConversation.asObservable();

  /**
   * Sends a message to a given subcollection (e.g. messages of a chat or thread).
   * Automatically sets the `createdAt` field to the server timestamp.
   *
   * @param parentPath - Path to the parent document (e.g. "chats/{chatId}").
   * @param subcollectionName - Name of the subcollection (e.g. "messages").
   * @param message - Message object without `createdAt` (timestamp is added automatically).
   * @returns A Promise that resolves once the message has been written.
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
   * Toggles a reaction for a given message.
   *
   * - If the user has already reacted with the emoji, their ID will be removed.
   * - Otherwise, their ID will be added.
   * - If the emoji does not exist yet, a new reaction document is created.
   *
   * @param parentPath - Path to the parent document (e.g. "chats/{chatId}").
   * @param subcollectionName - Name of the subcollection (e.g. "messages").
   * @param messageId - ID of the message being reacted to.
   * @param emoji - the image-path for the chosen emoji.
   * @returns A Promise that resolves once the reaction update has been applied.
   */
  async toggleReaction(
    parentPath: string,
    subcollectionName: string,
    messageId: string,
    emoji: string,
  ) {
    let userId = this.authService.getCurrentUserId()!;
    let reactionId = this.getReactionId(emoji);
    const reactionRef = doc(
      this.firestore,
      `${parentPath}/${subcollectionName}/${messageId}/reactions/${reactionId}`
    );

    const reactionSnap = await getDoc(reactionRef);

    if (reactionSnap.exists()) {
      const data = reactionSnap.data();
      const users: string[] = data['users'] || [];

      if (users.includes(userId)) {
        // User already reacted → remove their reaction
        await updateDoc(reactionRef, {
          users: arrayRemove(userId),
          //maybe add to delete doc in firestore, if there are no users with this reactin left?
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
        emoji,
        users: [userId],
      });
    }
  }

  /**
   * This functions uses the emoji to convert it to a proper reaction-id.
   *
   * @param emoji - the image-path for the chosen emoji.
   * @returns an adjusted string (the name of the emoji with '_' instead of '-')
   */
  getReactionId(emoji: string):string {
    return emoji.substring(18, emoji.length-4).replace(/-/g, '_');
  }

  /**
   * Fetches all reactions of a message in real time.
   *
   * @param parentPath - Path to the parent document (e.g. "chats/{chatId}").
   * @param subcollectionName - Name of the subcollection (e.g. "messages").
   * @param messageId - ID of the message whose reactions should be fetched.
   * @returns Observable that emits the list of reactions (with emoji name and user IDs).
   */
  getReactions(
    parentPath: string,
    subcollectionName: string,
    messageId: string
  ): Observable<ReactionInterface[]> {
    const reactionsRef = collection(
      this.firestore,
      `${parentPath}/${subcollectionName}/${messageId}/reactions`
    );
    return collectionData(reactionsRef, { idField: 'id' }) as Observable<
      ReactionInterface[]
    >;
  }

  /**
   * Deletes a message from Firestore.
   *
   * @param parentPath - Path to the parent document (e.g. "chats/{chatId}").
   * @param subcollectionName - Name of the subcollection (e.g. "messages").
   * @param messageId - ID of the message to be deleted.
   * @returns A Promise that resolves once the message has been removed.
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
   * Creates a new message inside a conversation.
   *
   * @param conversationId - ID of the conversation (chat or channel).
   * @param startedBy - User ID of the sender.
   * @param text - Text content of the message.
   * @param type - Type of conversation ("chat" or "channel").
   * @returns An observable placeholder (currently resolves to an empty array).
   */
  async createMessage(
    conversationId: string,
    startedBy: string,
    text: string,
    type: 'channel' | 'chat'
  ) {
    await this.sendMessage(`${type}s/${conversationId}`, 'messages', {
      senderId: startedBy,
      text,
    });
    return of([]);
  }

  /**
   * Creates an answer (reply) to an existing message inside a channel thread.
   *
   * @param channelId - ID of the channel.
   * @param messageId - ID of the parent message being replied to.
   * @param senderId - ID of the replying user.
   * @param text - Text content of the reply.
   * @param type - Type of conversation (currently only supports "channel").
   * @returns A Promise with the created answer document reference, or an empty observable if not in a channel.
   */
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
}
