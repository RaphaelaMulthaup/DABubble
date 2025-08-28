import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  CollectionReference,
  DocumentData,
} from '@angular/fire/firestore';
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  switchMap,
} from 'rxjs';

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

type SearchResult =
  | (User & { type: 'user' })
  | (Channel & { type: 'channel' })
  | (Message & { type: 'chatMessage' })
  | (Message & { type: 'channelMessage' })
  | (Answer & { type: 'answer' });

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
    this.listenToChannelMessages();
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

  private listenToChats() {
    const chatsCol = collection(this.firestore, 'chats');
    collectionData(chatsCol, { idField: 'id' }).subscribe((chats: any[]) => {
      chats.forEach((chat) => {
        const msgCol = collection(this.firestore, `chats/${chat.id}/messages`);
        collectionData(msgCol, { idField: 'id' }).subscribe((msgs: any[]) => {
          const enriched = msgs.map((m) => ({ ...m, chatId: chat.id }));
          this.chatMessages$.next([...this.chatMessages$.value, ...enriched]);

          // für jede Message Answers anhören
          msgs.forEach((m) => {
            const ansCol = collection(
              this.firestore,
              `chats/${chat.id}/messages/${m.id}/answers`
            );
            collectionData(ansCol, { idField: 'id' }).subscribe(
              (ans: any[]) => {
                const enrichedAns = ans.map((a) => ({
                  ...a,
                  parentMessageId: m.id,
                  chatId: chat.id,
                }));
                this.answers$.next([...this.answers$.value, ...enrichedAns]);
              }
            );
          });
        });
      });
    });
  }

  private listenToChannelMessages() {
    this.channels$.subscribe((channels) => {
      channels.forEach((channel) => {
        const msgCol = collection(
          this.firestore,
          `channels/${channel.id}/messages`
        );
        collectionData(msgCol, { idField: 'id' }).subscribe((msgs: any[]) => {
          const enriched = msgs.map((m) => ({ ...m, channelId: channel.id }));
          this.channelMessages$.next([
            ...this.channelMessages$.value,
            ...enriched,
          ]);

          msgs.forEach((m) => {
            const ansCol = collection(
              this.firestore,
              `channels/${channel.id}/messages/${m.id}/answers`
            );
            collectionData(ansCol, { idField: 'id' }).subscribe(
              (ans: any[]) => {
                const enrichedAns = ans.map((a) => ({
                  ...a,
                  parentMessageId: m.id,
                  channelId: channel.id,
                }));
                this.answers$.next([...this.answers$.value, ...enrichedAns]);
              }
            );
          });
        });
      });
    });
  }

  search(term$: Observable<string>): Observable<SearchResult[]> {
    return combineLatest([
      term$,
      this.users$,
      this.channels$,
      this.chatMessages$,
      this.channelMessages$,
      this.answers$,
    ]).pipe(
      map(([term, users, channels, chatMessages, channelMessages, answers]) => {
        const t = (term ?? '').toLowerCase();
        if (!t) return [] as SearchResult[];

        return [
          ...users
            .filter(
              (u) =>
                u.name?.toLowerCase().includes(t) ||
                u.email?.toLowerCase().includes(t)
            )
            .map((u) => ({ type: 'user' as const, ...u })), // <--- hier
          ...channels
            .filter((c) => c.name?.toLowerCase().includes(t))
            .map((c) => ({ type: 'channel' as const, ...c })), // <--- hier
          ...chatMessages
            .filter((m) => m.text?.toLowerCase().includes(t))
            .map((m) => ({ type: 'chatMessage' as const, ...m })), // <--- hier
          ...channelMessages
            .filter((m) => m.text?.toLowerCase().includes(t))
            .map((m) => ({ type: 'channelMessage' as const, ...m })), // <--- hier
          ...answers
            .filter((a) => a.text?.toLowerCase().includes(t))
            .map((a) => ({ type: 'answer' as const, ...a })), // <--- hier
        ] as SearchResult[];
      })
    );
  }
}
