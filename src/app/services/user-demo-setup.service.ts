import { Injectable } from '@angular/core';
import {
  arrayRemove,
  collection,
  doc,
  Firestore,
  getDocs,
  query,
  QueryDocumentSnapshot,
  where,
  writeBatch,
  WriteBatch,
} from '@angular/fire/firestore';
import { ChatService } from './chat.service';
import { PostService } from './post.service';
import { PostInterface } from '../shared/models/post.interface';
import { ChannelInterface } from '../shared/models/channel.interface';
import { ReactionsService } from './reactions.service';
import { async, take } from 'rxjs';
import { CHATMESSAGES } from '../shared/constants/demo-chat-messages';
import { DEVIDS } from '../shared/constants/demo-dev-ids';

@Injectable({
  providedIn: 'root',
})
export class UserDemoSetupService {
  devIds: string[] = DEVIDS;

  directChatMessages: Record<
    string,
    Pick<PostInterface, 'senderId' | 'text'>[]
  > = CHATMESSAGES;

  constructor(
    private chatService: ChatService,
    private postService: PostService,
    private firestore: Firestore
  ) {}

  async addDirectChatToTeam(guestId: string) {
    const tasks = this.devIds.map(async (devId) => {
      const { chatId, messages } = await this.createChatsAndProvideMessages(
        guestId,
        devId
      );
      return this.createMessagesForChat(chatId, messages);
    });
    await Promise.all(tasks);
  }

  async createChatsAndProvideMessages(guestId: string, devId: string) {
    await this.chatService.createChat(guestId, devId);
    const chatId = await this.chatService.getChatId(guestId, devId);
    const messages = this.directChatMessages[devId].map((msg) => ({
      ...msg,
      senderId: msg.senderId === 'guestId' ? guestId : msg.senderId,
    }));
    return { chatId, messages };
  }

  async createMessagesForChat(
    chatId: string,
    messages: Pick<PostInterface, 'senderId' | 'text'>[]
  ) {
    await Promise.all(
      messages.map((msg) =>
        this.postService.createMessage(chatId, msg.senderId, msg.text, 'chat')
      )
    );
  }

  async handleGuestsChannels(guestUserId: string) {
    const q = this.buildUserChannelsQuery(guestUserId);
    const snapshot = await getDocs(q);
    const batch = writeBatch(this.firestore);
    for (const docSnap of snapshot.docs) {
      await this.handleChannelBatchUpdate(batch, docSnap, guestUserId);
    }
    await batch.commit();
  }

  async handleChannelBatchUpdate(
    batch: WriteBatch,
    docSnap: QueryDocumentSnapshot,
    guestUserId: string
  ) {
    const channel = docSnap.data() as ChannelInterface;
    const channelRef = doc(this.firestore, 'channels', docSnap.id);
    if (channel.createdBy === guestUserId) {
      await this.deleteAllMessagesAndNestedSubcollections(channelRef.path);
      batch.delete(channelRef);
    } else {
      //Hier müssen noch alle Messages, Answers und Reactions des Gastes gelöscht werden
      batch.update(channelRef, { memberIds: arrayRemove(guestUserId) });
    }
  }

  private async deleteAllMessagesAndNestedSubcollections(channelPath: string) {
    const messagesRef = collection(this.firestore, `${channelPath}/messages`);
    const messagesSnap = await getDocs(messagesRef);
    for (const messageDoc of messagesSnap.docs) {
      await this.deleteMessageWithSubcollections(
        messageDoc.ref.path,
        messageDoc.ref
      );
    }
  }

  private async deleteMessageWithSubcollections(
    messagePath: string,
    messageRef: any
  ) {
    await this.deleteAllDocsInSubcollection(`${messagePath}/reactions`);
    const answersRef = collection(this.firestore, `${messagePath}/answers`);
    const answersSnap = await getDocs(answersRef);
    for (const answerDoc of answersSnap.docs) {
      await this.deleteAnswerWithReactions(answerDoc.ref.path, answerDoc.ref);
    }
    await this.safeDeleteDoc(messageRef);
  }

  private async deleteAllDocsInSubcollection(subcollectionPath: string) {
    const subRef = collection(this.firestore, subcollectionPath);
    const snap = await getDocs(subRef);
    const batch = writeBatch(this.firestore);
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    if (snap.docs.length > 0) {
      await batch.commit();
    }
  }

  private async deleteAnswerWithReactions(answerPath: string, answerRef: any) {
    await this.deleteAllDocsInSubcollection(`${answerPath}/reactions`);
    await this.safeDeleteDoc(answerRef);
  }

  private async safeDeleteDoc(ref: any) {
    const batch = writeBatch(this.firestore);
    batch.delete(ref);
    await batch.commit();
  }

  buildUserChannelsQuery(userId: string) {
    return query(
      collection(this.firestore, 'channels'),
      where('memberIds', 'array-contains', userId)
    );
  }

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
