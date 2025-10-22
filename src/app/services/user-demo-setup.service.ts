import { Injectable } from '@angular/core';
import {
  addDoc,
  arrayRemove,
  collection,
  doc,
  Firestore,
  getDocs,
  query,
  QueryDocumentSnapshot,
  updateDoc,
  where,
  writeBatch,
  WriteBatch,
} from '@angular/fire/firestore';
import { ChatService } from './chat.service';
import { PostService } from './post.service';
import { PostInterface } from '../shared/models/post.interface';
import { ChannelInterface } from '../shared/models/channel.interface';
import { async, take } from 'rxjs';
import { CHANNELANSWERS } from '../shared/constants/demo-channel-answers';
import { CHANNELMESSAGES } from '../shared/constants/demo-channel-messages';
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

  async createDemoChannel(guestId: string) {
    const channelRef = collection(this.firestore, 'channels');

    // Channel existiert noch nicht, also erstellen
    const channelData: ChannelInterface = {
      name: 'Entwicklerteam',
      description:
        'Hier kannst du dich zusammen mit den EntwicklerInnen über die Chat-App austauschen.',
      memberIds: [...this.devIds, guestId],
      createdBy: 'NxSyGPn1LkPV3bwLSeW94FPKRzm1',
      createdAt: new Date('2025-10-24T09:00:00'), // Startdatum
    };

    // Channel anlegen
    const channelDocRef = await addDoc(channelRef, channelData);

    // Die gesamte Unterhaltung als Nachrichten im Channel einfügen
    const messages = CHANNELMESSAGES;

    let lastMessageId: string | null = null;
    let forthMessageId: string | null = null;

    for (const [index, msg] of messages.entries()) {
      const messageId = await this.postService.createMessage(
        channelDocRef.id,
        msg.senderId,
        msg.text,
        'channel'
      );

      // createdAt nachträglich setzen
      await updateDoc(
        doc(
          this.firestore,
          `channels/${channelDocRef.id}/messages/${messageId}`
        ),
        { createdAt: msg.createdAt }
      );

      if (index === messages.length - 1) {
        lastMessageId = messageId;
      } else if (index === 3) {
        forthMessageId = messageId;
      }
    }

    if (lastMessageId) {
      const answers = CHANNELANSWERS;
      for (const answer of answers) {
        const answerId = await this.postService.createAnswer(
          channelDocRef.id,
          lastMessageId,
          answer.senderId,
          answer.text,
          'channel'
        );

        await updateDoc(
          doc(
            this.firestore,
            `channels/${channelDocRef.id}/messages/${lastMessageId}/answers/${answerId}`
          ),
          { createdAt: answer.createdAt }
        );
      }
    }
  }

  async handleGuestsChannels(guestUserId: string) {
    const q = this.buildUserChannelsQuery(guestUserId);
    const snapshot = await getDocs(q);
    const batch = writeBatch(this.firestore);
    for (const docSnap of snapshot.docs) {
      this.handleChannelBatchUpdate(batch, docSnap, guestUserId);
    }
    await batch.commit();
  }

  handleChannelBatchUpdate(
    batch: WriteBatch,
    docSnap: QueryDocumentSnapshot,
    guestUserId: string
  ) {
    const channel = docSnap.data() as ChannelInterface;
    const channelRef = doc(this.firestore, 'channels', docSnap.id);
    if (channel.createdBy === guestUserId) {
      batch.delete(channelRef);
    } else {
      batch.update(channelRef, { memberIds: arrayRemove(guestUserId) });
    }
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
