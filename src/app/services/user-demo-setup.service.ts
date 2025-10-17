import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { ChatService } from './chat.service';
import { PostService } from './post.service';
import { ScreenService } from './screen.service';
import { UserService } from './user.service';
import { PostInterface } from '../shared/models/post.interface';

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
    private postService: PostService
  ) {}

  async addDirectChatToTeam(guestId: string) {
    for (const devId of this.devIds) {
      const { chatId, messages } = await this.createChatsAndProvideMessages(
        guestId,
        devId
      );
      await this.createMessagesForChat(chatId, messages);
    }
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
    for (const msg of messages) {
      await this.postService.createMessage(
        chatId,
        msg.senderId,
        msg.text,
        'chat'
      );
    }
  }
}
