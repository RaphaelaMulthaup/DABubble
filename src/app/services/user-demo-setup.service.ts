import { Injectable } from '@angular/core';
import {
  arrayRemove,
  collection,
  CollectionReference,
  deleteDoc,
  deleteField,
  doc,
  DocumentData,
  DocumentReference,
  Firestore,
  getDoc,
  getDocs,
  query,
  QueryDocumentSnapshot,
  QuerySnapshot,
  updateDoc,
  where,
  writeBatch,
  WriteBatch,
} from '@angular/fire/firestore';
import { ChatService } from './chat.service';
import { PostService } from './post.service';
import { PostInterface } from '../shared/models/post.interface';
import { ChannelInterface } from '../shared/models/channel.interface';

@Injectable({
  providedIn: 'root',
})
export class UserDemoSetupService {
  devIds = [
    'YMOQBS4sWIQoVbLI2OUphJ7Ruug2',
    '5lntBSrRRUM9JB5AFE14z7lTE6n1',
    'rUnD1S8sHOgwxvN55MtyuD9iwAD2',
    'NxSyGPn1LkPV3bwLSeW94FPKRzm1',
  ];

  directChatMessages: Record<
    string,
    Pick<PostInterface, 'senderId' | 'text'>[]
  > = {
    YMOQBS4sWIQoVbLI2OUphJ7Ruug2: [
      {
        senderId: 'YMOQBS4sWIQoVbLI2OUphJ7Ruug2',
        text: 'Hey! Schön, dass du unseren Chat ausprobierst 😊',
      },
      { senderId: 'guestId', text: 'Hi! Sieht alles sehr gut aus!' },
      {
        senderId: 'YMOQBS4sWIQoVbLI2OUphJ7Ruug2',
        text: 'Freut mich! Probier ruhig ein paar Funktionen aus.',
      },
    ],

    '5lntBSrRRUM9JB5AFE14z7lTE6n1': [
      {
        senderId: '5lntBSrRRUM9JB5AFE14z7lTE6n1',
        text: 'Hallo! Schön, dass du dir unsere App anschaust.',
      },
      {
        senderId: 'guestId',
        text: 'Hi! Ja, ich gucke mich gerade ein bisschen um. Was war dein Beitrag zur Chat-App?',
      },
      {
        senderId: '5lntBSrRRUM9JB5AFE14z7lTE6n1',
        text: 'Ich habe zum Beispiel die Suchfunktion umgesetzt. Such doch mal nach dem Channel #Entwicklerteam.',
      },
    ],

    rUnD1S8sHOgwxvN55MtyuD9iwAD2: [
      {
        senderId: 'rUnD1S8sHOgwxvN55MtyuD9iwAD2',
        text: 'Hi! Willkommen im Demo-Chat 🎨',
      },
      { senderId: 'guestId', text: 'Danke! Alles wirkt sehr aufgeräumt.' },
      {
        senderId: 'rUnD1S8sHOgwxvN55MtyuD9iwAD2',
        text: 'Freut mich! Schau dich ruhig noch weiter um.',
      },
    ],

    NxSyGPn1LkPV3bwLSeW94FPKRzm1: [
      {
        senderId: 'NxSyGPn1LkPV3bwLSeW94FPKRzm1',
        text: 'Hey! Schön, dass du hier bist 🧠',
      },
      { senderId: 'guestId', text: 'Hi! Die App reagiert richtig flüssig.' },
      {
        senderId: 'NxSyGPn1LkPV3bwLSeW94FPKRzm1',
        text: 'Super! Dann viel Spaß beim Ausprobieren 🚀',
      },
    ],
  };

  channelEntwicklerteamDocRef;
  messagesChannelEntwicklerteamDocRef;

  constructor(
    private chatService: ChatService,
    private postService: PostService,
    private firestore: Firestore
  ) {
    this.channelEntwicklerteamDocRef = doc(
      this.firestore,
      `channels/2TrvdqcsYSbj2ZpWLfvT`
    );
    this.messagesChannelEntwicklerteamDocRef = collection(
      this.channelEntwicklerteamDocRef,
      'messages'
    );
  }

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

  async resetExampleChannel(guestUserId: string) {
    await updateDoc(this.channelEntwicklerteamDocRef, {
      memberIds: arrayRemove(guestUserId),
      name: 'Entwicklerteam',
      description:
        'Hier kannst du dich zusammen mit den EntwicklerInnen über die Chat-App austauschen.',
    });
    await this.resetMessagesExampleChannel(guestUserId);
  }

  async resetMessagesExampleChannel(guestUserId: string) {
    await this.deleteGuestsMessagesInExampleChannel(guestUserId);
    await this.filterMessagesWithReactions(guestUserId);
    const messagesWithAnswersQuery = query(
      this.messagesChannelEntwicklerteamDocRef,
      where('ansCounter', '>', 0)
    );
    const messagesWithAnswersSnapshot = await getDocs(messagesWithAnswersQuery);
    for (const msgDoc of messagesWithAnswersSnapshot.docs) {
      await this.handleMessagesWithAnswers(msgDoc, guestUserId);
    }
  }

  async deleteGuestsMessagesInExampleChannel(guestUserId: string) {
    const messagesQuery = query(
      this.messagesChannelEntwicklerteamDocRef,
      where('senderId', '==', guestUserId)
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    let batch = writeBatch(this.firestore);

    for (const msgDoc of messagesSnapshot.docs) {
      batch.delete(msgDoc.ref);
    }
    await batch.commit();
  }

  async filterMessagesWithReactions(guestUserId: string) {
    const messagesWithReactionsQuery = query(
      //alle messages aus Entwicklerteam mit reactions
      this.messagesChannelEntwicklerteamDocRef,
      where('hasReactions', '==', true)
    );
    const messagesWithReactionsSnapshot = await getDocs(
      //alle messages aus Entwicklerteam mit reactions
      messagesWithReactionsQuery
    );
    for (const msgDoc of messagesWithReactionsSnapshot.docs) {
      //eine message mit reactions
      await this.handleMessagesWithReactions(msgDoc, guestUserId);
    }
  }

  async handleMessagesWithReactions(
    msgDoc: QueryDocumentSnapshot<DocumentData>,
    guestUserId: string
  ) {
    const msgRef = msgDoc.ref; //eine message mit reactions
    const reactionsColRef = collection(msgRef, 'reactions'); //reaction collection einer message
    const reactionNamesSnap = await getDocs(reactionsColRef); //alle reaction docs einer message
    await this.deleteGuestUserIdAsSenderOfReactions(
      reactionNamesSnap,
      guestUserId
    );
    await this.setHasReactions(reactionsColRef, msgRef);
  }

  async deleteGuestUserIdAsSenderOfReactions(
    reactionNamesSnap: QuerySnapshot<DocumentData>,
    guestUserId: string
  ) {
    const localBatch = writeBatch(this.firestore);
    for (const reactionDoc of reactionNamesSnap.docs) {
      await this.deleteGuestReactionIfExists(
        reactionDoc.ref,
        guestUserId,
        localBatch
      );
    }
    await localBatch.commit();
  }

  async deleteGuestReactionIfExists(
    reactionDocRef: DocumentReference<DocumentData>,
    guestUserId: string,
    batch: WriteBatch
  ) {
    const reactionSnap = await getDoc(reactionDocRef);
    if (!reactionSnap.exists()) return;
    const users = reactionSnap.data()['users'] as string[] | undefined;
    if (!users || !users.includes(guestUserId)) return;
    const updatedUsers = this.removeGuestFromUsersArray(users, guestUserId);
    this.applyReactionChange(reactionDocRef, updatedUsers, batch);
  }

  private removeGuestFromUsersArray(users: string[], guestUserId: string) {
    return users.filter((id) => id !== guestUserId);
  }

  private applyReactionChange(
    reactionDocRef: DocumentReference<DocumentData>,
    updatedUsers: string[],
    batch: WriteBatch
  ) {
    if (updatedUsers.length === 0) {
      batch.delete(reactionDocRef);
      return;
    }
    batch.update(reactionDocRef, { users: updatedUsers });
  }

  async setHasReactions(
    reactionsColRef: CollectionReference<DocumentData>,
    msgRef: DocumentReference<DocumentData>
  ) {
    const remainingReactionNamesSnap = await getDocs(reactionsColRef);
    if (remainingReactionNamesSnap.empty) {
      await updateDoc(msgRef, { hasReactions: false });
    }
  }

  async handleMessagesWithAnswers(
    msgDoc: QueryDocumentSnapshot<DocumentData>,
    guestUserId: string
  ) {
    const msgRef = msgDoc.ref; //eine message mit answers
    const answersColRef = collection(msgRef, 'answers');
    const answersIdsSnap = await getDocs(answersColRef); //alle answers einer message
    await this.deleteAnswerfromGuestUserId(answersIdsSnap, guestUserId);
    await this.setAnsCounter(answersColRef, msgRef);
  }

  async deleteAnswerfromGuestUserId(
    answersIdsSnap: QuerySnapshot<DocumentData>, //alle answers einer message
    guestUserId: string
  ) {
    const localBatch = writeBatch(this.firestore);
    for (const answerDoc of answersIdsSnap.docs) {
      //eine answer
      await this.deleteGuestsAnswerIfExists(
        answerDoc.ref,
        guestUserId,
        localBatch
      );
    }
    await localBatch.commit();
  }

  async deleteGuestsAnswerIfExists(
    answerDocRef: DocumentReference<DocumentData>,
    guestUserId: string,
    localBatch: WriteBatch
  ) {
    const answerSnap = await getDoc(answerDocRef);
    if (!answerSnap.exists()) return;
    const answerData = answerSnap.data();
    const users = answerData['senderId'];
    if (users === guestUserId) {
      localBatch.delete(answerDocRef);
    }
  }

  async setAnsCounter(
    answersColRef: CollectionReference<DocumentData>,
    msgRef: DocumentReference<DocumentData>
  ) {
    const remainingAnswerSnap = await getDocs(answersColRef);
    if (remainingAnswerSnap.empty) {
      await updateDoc(msgRef, {
        ansCounter: deleteField(),
        ansLastCreatedAt: deleteField(),
      });
    } else {
      await this.handleRemainingAnswers(remainingAnswerSnap, msgRef);
    }
  }

  async handleRemainingAnswers(
    remainingAnswerSnap: QuerySnapshot<DocumentData>,
    msgRef: DocumentReference<DocumentData>
  ) {
    const createdAts = remainingAnswerSnap.docs.map(
      (doc) => doc.data()['createdAt']
    );
    const newestCreatedAt = createdAts.reduce((latest, current) => {
      return current.toMillis() > latest.toMillis() ? current : latest;
    });
    await updateDoc(msgRef, {
      ansCounter: remainingAnswerSnap.size,
      ansLastCreatedAt: newestCreatedAt,
    });
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

      // Alle Nachrichten im Batch löschen
      messagesSnap.docs.forEach((msg) => batch.delete(msg.ref));

      // Chat-Dokument selbst löschen
      batch.delete(chat.ref);

      // Batch ausführen
      await batch.commit();
    }
  }
}
