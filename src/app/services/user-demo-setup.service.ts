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
import { async } from 'rxjs';

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
    const messages = [
      {
        senderId: 'XbsVa8YOj8Nd9vztzX1kAQXrc7Z2',
        text: 'Wie wäre es, wenn wir beim eigenen User-List-Item noch ein "(Du)" hinzufügen, um den aktuellen Nutzer zu kennzeichnen?',
        createdAt: new Date('2025-10-24T09:05:00'),
      },
      {
        senderId: 'rUnD1S8sHOgwxvN55MtyuD9iwAD2',
        text: 'Das fände ich super! So sieht man direkt, dass es der eigene Account ist. Besonders für neue Nutzer ist das eine tolle Orientierung.',
        createdAt: new Date('2025-10-24T09:10:00'),
      },
      {
        senderId: '5lntBSrRRUM9JB5AFE14z7lTE6n1',
        text: 'Wir könnten eine kleine Abfrage einbauen, um zu prüfen, ob der User, der angezeigt wird, der aktuelle Nutzer ist. In dem Fall fügen wir das "(Du)" hinzu.',
        createdAt: new Date('2025-10-24T09:15:00'),
      },
      {
        senderId: 'rUnD1S8sHOgwxvN55MtyuD9iwAD2',
        text: 'Ich kann das umsetzen! Wir schauen dann, ob der User in `currentUser$` dem angezeigten User entspricht. Wenn ja, fügen wir das "(Du)" hinzu.',
        createdAt: new Date('2025-10-24T09:20:00'),
      },
      {
        senderId: 'NxSyGPn1LkPV3bwLSeW94FPKRzm1',
        text: 'Ich würde noch vorschlagen, dass wir darauf achten, dass das "Du" auch bei einem gekürzten Namen in einem kleineren Layout sichtbar bleibt. Der Name kann sich den Platz nehmen, bis er mit "..." gekürzt wird, aber das "(Du)" sollte immer daneben erscheinen.',
        createdAt: new Date('2025-10-24T09:25:00'),
      },
      {
        senderId: '5lntBSrRRUM9JB5AFE14z7lTE6n1',
        text: 'Super Idee! Dann ist es auch bei kleinen Bildschirmen klar, wer der eigene Account ist. Danke für den Vorschlag!',
        createdAt: new Date('2025-10-24T09:30:00'),
      },
      {
        senderId: 'NxSyGPn1LkPV3bwLSeW94FPKRzm1',
        text: 'Wie sieht es aus? Treffen wir uns am Montag zum Mergen?',
        createdAt: new Date('2025-10-24T09:35:00'),
      },
    ];

    // Nachrichten im Channel erstellen
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

      // ID der letzten Nachricht merken
      // if (index === messages.length - 1) {
      //   lastMessageId = messageId;
      // } else if (index === 3) {
      //   forthMessageId = messageId;
      // }
      // if (lastMessageId) {
      //   const answers = [
      //     {
      //       senderId: '5lntBSrRRUM9JB5AFE14z7lTE6n1',
      //       text: 'Montag klingt gut, wie viel Uhr?',
      //       createdAt: new Date('2025-10-24T09:40:00'),
      //     },
      //     {
      //       senderId: 'rUnD1S8sHOgwxvN55MtyuD9iwAD2',
      //       text: 'Ich wäre ab 10 Uhr dabei!',
      //       createdAt: new Date('2025-10-24T09:45:00'),
      //     },
      //     {
      //       senderId: 'XbsVa8YOj8Nd9vztzX1kAQXrc7Z2',
      //       text: 'Perfekt, dann planen wir 10 Uhr fest ein.',
      //       createdAt: new Date('2025-10-24T09:50:00'),
      //     },
      //   ];

      //   for (const answer of answers) {
      //     const answerId = await this.postService.createMessage(
      //       channelDocRef.id,
      //       answer.senderId,
      //       answer.text,
      //       'channel'
      //     );

      //     await updateDoc(
      //       doc(
      //         this.firestore,
      //         `channels/${channelDocRef.id}/messages/${lastMessageId}/answers/${answerId}`
      //       ),
      //       { createdAt: answer.createdAt }
      //     );
      //   }
      // } else if (forthMessageId) {

      // }
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
