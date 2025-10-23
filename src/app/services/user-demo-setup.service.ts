import { Injectable } from '@angular/core';
import { arrayRemove, collection, doc, Firestore, getDocs, query, QueryDocumentSnapshot, where, writeBatch, WriteBatch} from '@angular/fire/firestore';
import { ChatService } from './chat.service';
import { PostService } from './post.service';
import { PostInterface } from '../shared/models/post.interface';
import { ChannelInterface } from '../shared/models/channel.interface';
import { CHATMESSAGES } from '../shared/constants/demo-chat-messages';
import { DEVIDS } from '../shared/constants/demo-dev-ids';

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
  ) {}

  /**
   * Adds a direct chat between a guest user and all developer users, and fills it with demo messages.
   *
   * @param guestId - The UID of the guest user
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
   * @param guestId - The UID of the guest user
   * @param devId - The UID of the developer
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
   * @param guestUserId - The UID of the guest user
   */
  async handleGuestsChannels(guestUserId: string) {
    const q = this.buildUserChannelsQuery(guestUserId);
    const snapshot = await getDocs(q);
    const batch = writeBatch(this.firestore);
    for (const docSnap of snapshot.docs) this.handleChannelBatchUpdate(batch, docSnap, guestUserId);
    await batch.commit();
  }

  /**
   * Handles a single channel update in the Firestore batch.
   * Deletes channels created by the guest or removes them as a member otherwise.
   *
   * @param batch - The Firestore batch operation
   * @param docSnap - The channel document snapshot
   * @param guestUserId - The UID of the guest user
   */
  handleChannelBatchUpdate( batch: WriteBatch, docSnap: QueryDocumentSnapshot, guestUserId: string) {
    const channel = docSnap.data() as ChannelInterface;
    const channelRef = doc(this.firestore, 'channels', docSnap.id);
    if (channel.createdBy === guestUserId) {
      batch.delete(channelRef);
    } else batch.update(channelRef, { memberIds: arrayRemove(guestUserId) });
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
   * Deletes all chats and their messages associated with a given user.
   *
   * @param userId - The UID of the user whose chats should be deleted
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