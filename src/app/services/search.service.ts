import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Channel {
  id: string;
  name: string;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  chatId?: string;
  channelId?: string;
}

interface Answer extends Message {
  parentMessageId: string;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private users$ = new BehaviorSubject<User[]>([]);
  private channels$ = new BehaviorSubject<Channel[]>([]);
  private chatMessages$ = new BehaviorSubject<Message[]>([]);
  private channelMessages$ = new BehaviorSubject<Message[]>([]);
  private answers$ = new BehaviorSubject<Answer[]>([]);

  constructor(private firestore: Firestore) {
    this.listenToUsers();
    this.listenToChannels();
    this.listenToChats();
  }

  private listenToUsers() {
    const usersCol = collection(this.firestore, 'users');
    collectionData(usersCol, { idField: 'id' }).subscribe((data) =>
      this.users$.next(data as User[])
    );
  }

  private listenToChannels() {
    const channelsCol = collection(this.firestore, 'channels');
    collectionData(channelsCol, { idField: 'id' }).subscribe((data) =>
      this.channels$.next(data as Channel[])
    );
  }

  private async listenToChats() {
    const chatsCol = collection(this.firestore, 'chats');
    collectionData(chatsCol, { idField: 'id' }).subscribe(async (chats) => {
      const chatMsgs: Message[] = [];
      const ans: Answer[] = [];
      const channelMsgs: Message[] = [];

      for (const chat of chats as any[]) {
        // Chat-Messages
        const msgCol = collection(this.firestore, `chats/${chat.id}/messages`);
        const msgs = await collectionData(msgCol, {
          idField: 'id',
        }).toPromise();
        for (const m of msgs as any[]) {
          chatMsgs.push({ ...m, chatId: chat.id });
          // Answers
          const ansCol = collection(
            this.firestore,
            `chats/${chat.id}/messages/${m.id}/answers`
          );
          const answersData = (await collectionData(ansCol, {
            idField: 'id',
          }).toPromise()) as Answer[];
          answersData.forEach((a) =>
            ans.push({ ...a, parentMessageId: m.id, chatId: chat.id })
          );
        }
      }

      // Channel-Messages
      const channels = this.channels$.value;
      for (const channel of channels) {
        const msgCol = collection(
          this.firestore,
          `channels/${channel.id}/messages`
        );
        const msgs = await collectionData(msgCol, {
          idField: 'id',
        }).toPromise();
        for (const m of msgs as any[]) {
          channelMsgs.push({ ...m, channelId: channel.id });
          const ansCol = collection(
            this.firestore,
            `channels/${channel.id}/messages/${m.id}/answers`
          );
          const answersData = (await collectionData(ansCol, {
            idField: 'id',
          }).toPromise()) as Answer[];
          answersData.forEach((a) =>
            ans.push({ ...a, parentMessageId: m.id, channelId: channel.id })
          );
        }
      }

      this.chatMessages$.next(chatMsgs);
      this.channelMessages$.next(channelMsgs);
      this.answers$.next(ans);
    });
  }

  // Reaktive Suche: Observable, das auf Änderungen reagiert
 search(term$: Observable<string>) {
    return combineLatest([
      term$,
      this.users$,
      this.channels$,
      this.chatMessages$,
      this.channelMessages$,
      this.answers$
    ]).pipe(
      map(([term, users, channels, chatMessages, channelMessages, answers]) => {
        const t = (term ?? '').toLowerCase();
        if (!t) return [];

        const results: any[] = [];
        results.push(
          ...users.filter(u => u.name?.toLowerCase().includes(t) || u.email?.toLowerCase().includes(t))
                  .map(u => ({ type: 'user', ...u })),
          ...channels.filter(c => c.name?.toLowerCase().includes(t))
                     .map(c => ({ type: 'channel', ...c })),
          ...chatMessages.filter(m => m.text?.toLowerCase().includes(t))
                         .map(m => ({ type: 'chatMessage', ...m })),
          ...channelMessages.filter(m => m.text?.toLowerCase().includes(t))
                            .map(m => ({ type: 'channelMessage', ...m })),
          ...answers.filter(a => a.text?.toLowerCase().includes(t))
                    .map(a => ({ type: 'answer', ...a }))
        );
        return results;
      })
    );
  }
}
