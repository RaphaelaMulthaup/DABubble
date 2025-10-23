import { Injectable } from '@angular/core';
import {
  arrayRemove,
  collection,
  CollectionReference,
  doc,
  DocumentData,
  DocumentReference,
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
import { CHATMESSAGES } from '../shared/constants/demo-chat-messages';
import { DEVIDS } from '../shared/constants/demo-dev-ids';
import { ResetDemoChannelService } from './reset-demo-channel.service';

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
    private resetDemoChannelService: ResetDemoChannelService,
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

  buildUserChannelsQuery(userId: string) {
    return query(
      collection(this.firestore, 'channels'),
      where('memberIds', 'array-contains', userId)
    );
  }

  async handleChannelBatchUpdate(
    batch: WriteBatch,
    docSnap: QueryDocumentSnapshot,
    guestUserId: string
  ) {
    const channel = docSnap.data() as ChannelInterface;
    const channelRef = doc(this.firestore, 'channels', docSnap.id);
    if (channel.createdBy === guestUserId) {
      await this.handleChannelDeletion(batch, channelRef);
    } else {
      await this.handleGuestExit(batch, channelRef, guestUserId);
    }
  }

  async handleChannelDeletion(
    batch: WriteBatch,
    channelRef: DocumentReference
  ) {
    await this.deleteAllMessagesAndNestedSubcollections(channelRef.path);
    batch.delete(channelRef);
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

  async handleGuestExit(
    batch: WriteBatch,
    channelRef: DocumentReference,
    guestUserId: string
  ) {
    await this.deleteGuestMessagesAnswersAndReactions(channelRef, guestUserId);
    batch.update(channelRef, { memberIds: arrayRemove(guestUserId) });
  }

  async deleteGuestMessagesAnswersAndReactions(
    channelRef: DocumentReference,
    guestUserId: string
  ) {
    const messagesCol = collection(channelRef, 'messages');
    await this.deleteGuestMessages(messagesCol, guestUserId);
    await this.removeGuestReactions(messagesCol, guestUserId);
    await this.removeGuestAnswers(messagesCol, guestUserId);
  }

  async deleteGuestMessages(
    messagesCol: CollectionReference,
    guestUserId: string
  ) {
    const q = query(messagesCol, where('senderId', '==', guestUserId));
    const snap = await getDocs(q);
    const batch = writeBatch(this.firestore);
    for (const msgDoc of snap.docs) {
      await this.resetDemoChannelService.deleteAnswersReactionsAndMessage(
        batch,
        msgDoc
      );
    }
    await batch.commit();
  }

  async removeGuestReactions(
    messagesCol: CollectionReference,
    guestUserId: string
  ) {
    const q = query(messagesCol, where('hasReactions', '==', true));
    const snap = await getDocs(q);
    for (const msgDoc of snap.docs) {
      await this.resetDemoChannelService.handleMessagesWithReactions(
        msgDoc,
        guestUserId
      );
    }
  }

  async removeGuestAnswers(
    messagesCol: CollectionReference,
    guestUserId: string
  ) {
    const q = query(messagesCol, where('ansCounter', '>', 0));
    const snap = await getDocs(q);
    for (const msgDoc of snap.docs) {
      await this.resetDemoChannelService.handleMessagesWithAnswers(
        msgDoc,
        guestUserId
      );
      await this.handleAnswersWithReactions(msgDoc, guestUserId);
    }
  }

  async handleAnswersWithReactions(
    msgDoc: QueryDocumentSnapshot<DocumentData>,
    guestUserId: string
  ) {
    const answersSnap = await getDocs(collection(msgDoc.ref, 'answers'));
    for (const ansDoc of answersSnap.docs) {
      await this.handleSingleAnswerReactions(ansDoc, guestUserId);
    }
  }

  async handleSingleAnswerReactions(
    ansDoc: QueryDocumentSnapshot<DocumentData>,
    guestUserId: string
  ) {
    const reactionsColRef = collection(ansDoc.ref, 'reactions');
    const reactionsSnap = await getDocs(reactionsColRef);
    await this.resetDemoChannelService.deleteGuestUserIdAsSenderOfReactions(
      reactionsSnap,
      guestUserId
    );
    await this.resetDemoChannelService.setHasReactions(
      reactionsColRef,
      ansDoc.ref
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
