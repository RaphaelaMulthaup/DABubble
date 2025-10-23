import { Injectable } from '@angular/core';
import { arrayRemove, collection, CollectionReference, doc, DocumentData, DocumentReference, Firestore, getDocs, query, QueryDocumentSnapshot, where, writeBatch, WriteBatch} from '@angular/fire/firestore';
import { ChatService } from './chat.service';
import { PostService } from './post.service';
import { PostInterface } from '../shared/models/post.interface';
import { ChannelInterface } from '../shared/models/channel.interface';
import { CHATMESSAGES } from '../shared/constants/demo-chat-messages';
import { DEVIDS } from '../shared/constants/demo-dev-ids';
import { ResetDemoChannelService } from './reset-demo-channel.service';

@Injectable({
  providedIn: 'root',
})
export class UserDemoSetupService {
  devIds: string[] = DEVIDS;
  directChatMessages: Record<string,Pick<PostInterface, 'senderId' | 'text'>[]> = CHATMESSAGES;

  constructor(
    private chatService: ChatService,
    private firestore: Firestore,
    private postService: PostService,
    private resetDemoChannelService: ResetDemoChannelService
  ) {}

  /**
   * Adds a direct chat between a guest user and all developer users, and fills it with demo messages.
   *
   * @param guestId - The id of the guest user
   */
  async addDirectChatToTeam(guestId: string) {
    const tasks = this.devIds.map(async (devId) => {
      const { chatId, messages } = await this.createChatsAndProvideMessages( guestId, devId);
      return this.createMessagesForChat(chatId, messages);
    });
    await Promise.all(tasks);
  }

  /**
   * Creates a chat between a guest and each developer, then provides prepared demo messages for that chat.
   *
   * @param guestId - The id of the guest user
   * @param devId - The id of the developer
   */
  async createChatsAndProvideMessages(guestId: string, devId: string) {
    await this.chatService.createChat(guestId, devId);
    const chatId = await this.chatService.getChatId(guestId, devId);
    const messages = this.directChatMessages[devId].map((msg) => ({
      ...msg,
      senderId: msg.senderId === 'guestId' ? guestId : msg.senderId,
    }));
    return { chatId, messages };
  }

  /**
   * Creates multiple messages for a specific chat.
   *
   * @param chatId - The chat ID where the messages will be created
   * @param messages - The list of messages to add
   */
  async createMessagesForChat( chatId: string, messages: Pick<PostInterface, 'senderId' | 'text'>[]) {
    await Promise.all(messages.map((msg) => this.postService.createMessage(chatId, msg.senderId, msg.text, 'chat')));
  }

  /**
   * Removes a guest user from all their joined channels and deletes the ones they created.
   *
   * @param guestUserId - The id of the guest user
   */
  async handleGuestsChannels(guestUserId: string) {
    const q = this.buildUserChannelsQuery(guestUserId);
    const snapshot = await getDocs(q);
    const batch = writeBatch(this.firestore);
    for (const docSnap of snapshot.docs) await this.handleChannelBatchUpdate(batch, docSnap, guestUserId);
    await batch.commit();
  }

  
  /**
   * Builds a Firestore query to find all channels where the user is a member.
   *
   * @param userId - The user ID to filter by
   */
  buildUserChannelsQuery(userId: string) {
    return query(
      collection(this.firestore, 'channels'),
      where('memberIds', 'array-contains', userId)
    );
  }

  /**
   * Handles a single channel update in the Firestore batch.
   * Deletes channels created by the guest or removes them as a member otherwise.
   *
   * @param batch - The Firestore batch operation
   * @param docSnap - The channel document snapshot
   * @param guestUserId - The id of the guest user
   */
  async handleChannelBatchUpdate(
    batch: WriteBatch,
    docSnap: QueryDocumentSnapshot,
    guestUserId: string
  ) {
    const channel = docSnap.data() as ChannelInterface;
    const channelRef = doc(this.firestore, 'channels', docSnap.id);
    if (channel.createdBy === guestUserId) {
      await this.handleChannelDeletion(batch, channelRef);
    } else await this.handleGuestExit(batch, channelRef, guestUserId);
  }

  /**
   * Handles complete channel deletion, including all nested subcollections.
   * 
   * @param batch - Firestore write batch used for grouped operations
   * @param channelRef - Reference to the channel document to delete
   */
  async handleChannelDeletion(batch: WriteBatch, channelRef: DocumentReference) {
    await this.deleteAllMessagesAndNestedSubcollections(channelRef.path);
    batch.delete(channelRef);
  }

  /**
   * Deletes all messages and their nested subcollections under a given channel path.
   * 
   * @param channelPath - Firestore path to the channel document
   */
  async deleteAllMessagesAndNestedSubcollections(channelPath: string) {
    const messagesRef = collection(this.firestore, `${channelPath}/messages`);
    const messagesSnap = await getDocs(messagesRef);
    for (const messageDoc of messagesSnap.docs) await this.deleteMessageWithSubcollections(messageDoc.ref.path, messageDoc.ref);
  }

  /**
   * Deletes a single message and all related subcollections (answers, reactions).
   * 
   * @param messagePath - Firestore path to the message document
   * @param messageRef - Reference to the message document
   */
  async deleteMessageWithSubcollections( messagePath: string, messageRef: any) {
    await this.deleteAllDocsInSubcollection(`${messagePath}/reactions`);
    const answersRef = collection(this.firestore, `${messagePath}/answers`);
    const answersSnap = await getDocs(answersRef);
    for (const answerDoc of answersSnap.docs) await this.deleteAnswerWithReactions(answerDoc.ref.path, answerDoc.ref);
    await this.safeDeleteDoc(messageRef);
  }

  /**
   * Deletes all documents inside a given subcollection path.
   * 
   * @param subcollectionPath - Firestore path to the subcollection
   */
  async deleteAllDocsInSubcollection(subcollectionPath: string) {
    const subRef = collection(this.firestore, subcollectionPath);
    const snap = await getDocs(subRef);
    const batch = writeBatch(this.firestore);
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    if (snap.docs.length > 0) await batch.commit();
  }

  /**
   * Deletes an answer and its reactions subcollection.
   * 
   * @param answerPath - Firestore path to the answer document
   * @param answerRef - Reference to the answer document
   */
  async deleteAnswerWithReactions(answerPath: string, answerRef: any) {
    await this.deleteAllDocsInSubcollection(`${answerPath}/reactions`);
    await this.safeDeleteDoc(answerRef);
  }

  /**
   * Safely deletes a Firestore document using a write batch.
   * 
   * @param ref Reference to the document to delete.
   */
  async safeDeleteDoc(ref: any) {
    const batch = writeBatch(this.firestore);
    batch.delete(ref);
    await batch.commit();
  }

  /**
   * Handles guest user removal from a channel and cleans up their messages, answers, and reactions.
   * 
   * @param batch - Firestore write batch used for grouped operations.
   * @param channelRef - Reference to the channel document.
   * @param guestUserId - id of the guest user being removed.
   */
  async handleGuestExit(batch: WriteBatch, channelRef: DocumentReference, guestUserId: string) {
    await this.deleteGuestMessagesAnswersAndReactions(channelRef, guestUserId);
    batch.update(channelRef, { memberIds: arrayRemove(guestUserId) });
  }

  
  /**
   * Deletes all messages, answers, and reactions created by a guest user in a channel.
   * 
   * @param channelRef - Reference to the channel document
   * @param guestUserId - id of the guest user
   */
  async deleteGuestMessagesAnswersAndReactions(channelRef: DocumentReference, guestUserId: string) {
    const messagesCol = collection(channelRef, 'messages');
    await this.deleteGuestMessages(messagesCol, guestUserId);
    await this.removeGuestReactions(messagesCol, guestUserId);
    await this.removeGuestAnswers(messagesCol, guestUserId);
  }

  /**
   * Deletes all messages from a guest user within a message collection.
   * 
   * @param messagesCol - Firestore reference to the messages collection
   * @param guestUserId - id of the guest user
   */
  async deleteGuestMessages(messagesCol: CollectionReference, guestUserId: string) {
    const q = query(messagesCol, where('senderId', '==', guestUserId));
    const snap = await getDocs(q);
    const batch = writeBatch(this.firestore);
    for (const msgDoc of snap.docs) await this.resetDemoChannelService.deleteAnswersReactionsAndMessage(batch, msgDoc);
    await batch.commit();
  }

  /**
   * Removes all guest reactions from messages in a channel.
   * 
   * @param messagesCol - Firestore reference to the messages collection
   * @param guestUserId - id of the guest user
   */
  async removeGuestReactions(messagesCol: CollectionReference, guestUserId: string) {
    const q = query(messagesCol, where('hasReactions', '==', true));
    const snap = await getDocs(q);
    for (const msgDoc of snap.docs) await this.resetDemoChannelService.handleMessagesWithReactions(msgDoc, guestUserId);
  }

  /**
   * Removes all guest answers (and their reactions) from messages in a channel.
   * 
   * @param messagesCol - Firestore reference to the messages collection
   * @param guestUserId - id of the guest user
   */
  async removeGuestAnswers(messagesCol: CollectionReference, guestUserId: string) {
    const q = query(messagesCol, where('ansCounter', '>', 0));
    const snap = await getDocs(q);
    for (const msgDoc of snap.docs) {
      await this.resetDemoChannelService.handleMessagesWithAnswers(msgDoc, guestUserId);
      await this.handleAnswersWithReactions(msgDoc, guestUserId);
    }
  }

  /**
   * Handles deletion of reactions within all answers for a given message.
   * 
   * @param msgDoc - Message document snapshot
   * @param guestUserId - id of the guest user
   */
  async handleAnswersWithReactions(msgDoc: QueryDocumentSnapshot<DocumentData>, guestUserId: string) {
    const answersSnap = await getDocs(collection(msgDoc.ref, 'answers'));
    for (const ansDoc of answersSnap.docs) await this.handleSingleAnswerReactions(ansDoc, guestUserId);
  }

  /**
   * Removes guest reactions from a specific answer document.
   * 
   * @param ansDoc - Answer document snapshot
   * @param guestUserId - id of the guest user
   */
  async handleSingleAnswerReactions(ansDoc: QueryDocumentSnapshot<DocumentData>, guestUserId: string) {
    const reactionsColRef = collection(ansDoc.ref, 'reactions');
    const reactionsSnap = await getDocs(reactionsColRef);
    await this.resetDemoChannelService.deleteGuestUserIdAsSenderOfReactions(reactionsSnap, guestUserId);
    await this.resetDemoChannelService.setHasReactions(reactionsColRef, ansDoc.ref);
  }
  
  /**
   * Deletes all chats and their messages associated with a given user.
   *
   * @param userId - The id of the user whose chats should be deleted
   */
  async deleteChats(userId: string) {
    const userChats = await this.chatService.getChatRefsForUser(userId);
    for (const chat of userChats) {
      const messagesRef = collection(chat.ref, 'messages');
      const messagesSnap = await getDocs(messagesRef);
      const batch = writeBatch(this.firestore);
      messagesSnap.docs.forEach((msg) => batch.delete(msg.ref));
      batch.delete(chat.ref);
      await batch.commit();
    }
  }
}