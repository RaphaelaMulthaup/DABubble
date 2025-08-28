import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
} from '@angular/fire/firestore';
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
} from 'rxjs';
import { UserSearchInterface } from '../shared/models/userSearch.interface'
import { ChannelSearchInterface } from '../shared/models/channelSearch.interface'
import { MessageSearchInterface } from '../shared/models/messageSearch.interface'
import { AnswerSearchInterface } from '../shared/models/answerSearch.interface'
import { SearchResult } from '../shared/search-result.type';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private users$ = new BehaviorSubject<UserSearchInterface[]>([]);
  private channels$ = new BehaviorSubject<ChannelSearchInterface[]>([]);
  private chatMessages$ = new BehaviorSubject<MessageSearchInterface[]>([]);
  private channelMessages$ = new BehaviorSubject<MessageSearchInterface[]>([]);
  private answers$ = new BehaviorSubject<AnswerSearchInterface[]>([]);

  constructor(private firestore: Firestore, private authService: AuthService) {
    this.listenToUsers();
    this.listenToChannels();
    this.listenToChats();
    this.listenToChannelMessages();
  }

  private listenToUsers() {
    const usersCol = collection(this.firestore, 'users');
    collectionData(usersCol, { idField: 'id' }).subscribe((data) =>
      this.users$.next(data as UserSearchInterface[])
    );
  }

private listenToChannels() {
  const currentUserId = this.authService.currentUser?.uid;

  const channelsCol = collection(this.firestore, 'channels');
  collectionData(channelsCol, { idField: 'id' }).subscribe((data: any[]) => {
    if (!currentUserId) {
      this.channels$.next([]);
      return;
    }

    const userChannels = data.filter(channel =>
      channel.memberIds?.includes(currentUserId)
    );

    this.channels$.next(userChannels as ChannelSearchInterface[]);
  });
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
      const msgCol = collection(this.firestore, `channels/${channel.id}/messages`);
      collectionData(msgCol, { idField: 'id' }).subscribe((msgs: any[]) => {
        const enriched = msgs.map((m) => ({
          ...m,
          channelId: channel.id,
          channelName: channel.name,
        }));
        this.channelMessages$.next([...this.channelMessages$.value, ...enriched]);

        msgs.forEach((m) => {
          const ansCol = collection(this.firestore, `channels/${channel.id}/messages/${m.id}/answers`);
          collectionData(ansCol, { idField: 'id' }).subscribe((ans: any[]) => {
            const enrichedAns = ans.map((a) => ({
              ...a,
              parentMessageId: m.id,
              channelId: channel.id,
              channelName: channel.name,
            }));
            this.answers$.next([...this.answers$.value, ...enrichedAns]);
          });
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
