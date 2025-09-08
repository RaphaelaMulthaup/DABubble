import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { SearchResult } from '../shared/types/search-result.type';
import { AuthService } from './auth.service';
import { UserInterface } from '../shared/models/user.interface';
import { ChannelInterface } from '../shared/models/channel.interface';
import { PostInterface } from '../shared/models/post.interface';
import { ChatService } from './chat.service';

@Injectable({ providedIn: 'root' })
export class SearchService {
  chatService = inject(ChatService);
  private allChannels$ = new BehaviorSubject<ChannelInterface[]>([]);
  private userChannels$ = new BehaviorSubject<ChannelInterface[]>([]);

  // Local state managed with BehaviorSubjects for real-time updates
  private users$ = new BehaviorSubject<UserInterface[]>([]);
  private channels$ = new BehaviorSubject<ChannelInterface[]>([]);
  private chatPosts$ = new BehaviorSubject<PostInterface[]>([]);
  private channelPosts$ = new BehaviorSubject<PostInterface[]>([]);

  private initAfterLogin() {
    this.authService.currentUser$.subscribe((user) => {
      if (!user) return; // noch kein User, nichts machen
      const uid = user.uid;

      // Channels und Chats laden
      this.loadChannelsForUser(uid);
      this.loadChatsForUser(uid);
    });
  }

  constructor(private firestore: Firestore, private authService: AuthService) {
    this.listenToUsers(); // Users kann man immer laden
    this.initAfterLogin(); // Channels & Chats erst nach User
    this.listenToChannelMessages();
    this.loadAllChannels();
    this.userChannels$.subscribe((chs) => this.channels$.next(chs));
  }

  private loadAllChannels() {
    const channelsCol = collection(this.firestore, 'channels');
    collectionData(channelsCol, { idField: 'id' }).subscribe((data: any[]) => {
      this.allChannels$.next(data as ChannelInterface[]);
    });
  }

  /***
   * Listen to all users in Firestore and keep them updated in users$.
   * Data is cast to UserInterface for search functionality.
   */
  private listenToUsers() {
    const usersCol = collection(this.firestore, 'users');
    collectionData(usersCol, { idField: 'id' }).subscribe((data) =>
      this.users$.next(data as UserInterface[])
    );
  }

  private loadChannelsForUser(userId: string) {
    const channelsCol = collection(this.firestore, 'channels');
    collectionData(channelsCol, { idField: 'id' }).subscribe((data: any[]) => {
      const userChannels = data.filter((channel) =>
        channel.memberIds?.includes(userId)
      );
      this.userChannels$.next(userChannels as ChannelInterface[]);
    });
  }

  private loadChatsForUser(currentUserId: string) {
    const chatsCol = collection(this.firestore, 'chats');
    collectionData(chatsCol, { idField: 'id' }).subscribe((chats: any[]) => {
      const userChats = chats.filter((chat) => {
        const [user1, user2] = chat.id.split('_');
        return user1 === currentUserId || user2 === currentUserId;
      });

      userChats.forEach((chat) => {
        const msgCol = collection(this.firestore, `chats/${chat.id}/messages`);
        collectionData(msgCol, { idField: 'id' }).subscribe((msgs: any[]) => {
          const enriched: (PostInterface & { chatId: string })[] = msgs.map(
            (m) => ({ ...(m as PostInterface), chatId: chat.id })
          );

          // **Duplikate vermeiden**
          const newPosts = enriched.filter(
            (m) => !this.chatPosts$.value.some((p) => p.id === m.id)
          );
          this.chatPosts$.next([...this.chatPosts$.value, ...newPosts]);

          // Antworten
          msgs.forEach((m) => {
            const ansCol = collection(
              this.firestore,
              `chats/${chat.id}/messages/${m.id}/answers`
            );
            collectionData(ansCol, { idField: 'id' }).subscribe(
              (ans: any[]) => {
                const enrichedAns: (PostInterface & {
                  chatId: string;
                  answer: true;
                  parentMessageId: string;
                })[] = ans.map((a) => ({
                  ...(a as PostInterface),
                  chatId: chat.id,
                  answer: true,
                  parentMessageId: m.id,
                }));

                const newAnswers = enrichedAns.filter(
                  (a) => !this.chatPosts$.value.some((p) => p.id === a.id)
                );
                this.chatPosts$.next([...this.chatPosts$.value, ...newAnswers]);
              }
            );
          });
        });
      });
    });
  }
  /***
   * Listen to all channel messages for the channels the user is in.
   * Also loads answers nested under each message.
   */
  private listenToChannelMessages() {
    this.channels$.subscribe((channels) => {
      channels.forEach((channel) => {
        const msgCol = collection(
          this.firestore,
          `channels/${channel.id}/messages`
        );
        collectionData(msgCol, { idField: 'id' }).subscribe((msgs: any[]) => {
          const enriched = msgs.map((m) => ({
            ...m,
            channelId: channel.id,
            channelName: channel.name,
          }));

          const newPosts = enriched.filter(
            (m) => !this.channelPosts$.value.some((p) => p.id === m.id)
          );
          this.channelPosts$.next([...this.channelPosts$.value, ...newPosts]);

          // Antworten
          msgs.forEach((m) => {
            const ansCol = collection(
              this.firestore,
              `channels/${channel.id}/messages/${m.id}/answers`
            );
            collectionData(ansCol, { idField: 'id' }).subscribe(
              (ans: any[]) => {
                const enrichedAns: (PostInterface & {
                  channelId: string;
                  answer: true;
                  parentMessageId: string;
                })[] = ans.map((a) => ({
                  ...(a as PostInterface),
                  channelId: channel.id!,
                  answer: true,
                  parentMessageId: m.id,
                }));

                const newAnswers = enrichedAns.filter(
                  (a) => !this.channelPosts$.value.some((p) => p.id === a.id)
                );
                this.channelPosts$.next([
                  ...this.channelPosts$.value,
                  ...newAnswers,
                ]);
              }
            );
          });
        });
      });
    });
  }

  /***
   * Perform a combined search across users, channels, chat messages,
   * channel messages, and answers. Matches are case-insensitive.
   */
  search(
    term$: Observable<string>,
    opts?: { includeAllChannels?: boolean }
  ): Observable<SearchResult[]> {
    const channels$ = opts?.includeAllChannels
      ? this.allChannels$
      : this.userChannels$;

    return combineLatest([
      term$,
      this.users$,
      channels$,
      this.chatPosts$,
      this.channelPosts$,
    ]).pipe(
      map(([term, users, channels, chatMessages, channelMessages]) => {
        const t = (term ?? '').trim().toLowerCase();
        if (!t) return [] as SearchResult[];

        if (t === '@') {
          return users.map((u) => ({ type: 'user' as const, ...u }));
        }

        if (t === '#') {
          return channels.map((c) => ({ type: 'channel' as const, ...c }));
        }

        if (t.startsWith('@')) {
          const query = t.slice(1);
          return users
            .filter((u) => u.name?.toLowerCase().includes(query))
            .map((u) => ({ type: 'user' as const, ...u }));
        }

        if (t.startsWith('#')) {
          const query = t.slice(1);
          return channels
            .filter((c) => c.name?.toLowerCase().includes(query))
            .map((c) => ({ type: 'channel' as const, ...c }));
        }

        return [
          ...users
            .filter((u) => u.name?.toLowerCase().includes(t))
            .map((u) => ({ type: 'user' as const, ...u })),
          ...channels
            .filter((c) => c.name?.toLowerCase().includes(t))
            .map((c) => ({ type: 'channel' as const, ...c })),
          ...chatMessages
            .filter(
              (m): m is PostInterface & { chatId: string } =>
                !!m.chatId && m.text?.toLowerCase().includes(t)
            )
            .map((m) => {
              const otherUserId = this.chatService.getOtherUserId(
                m.chatId,
                this.authService.currentUser!.uid
              );
              const otherUser = users.find((u) => u.uid === otherUserId)!;
              return { type: 'chatMessage' as const, ...m, user: otherUser };
            }),
          ...channelMessages
            .filter((m) => m.text?.toLowerCase().includes(t))
            .map((m) => {
              const channel = channels.find((c) => c.id === m.channelId)!;
              return { type: 'channelMessage' as const, ...m, channel };
            }),
        ];
      })
    );
  }

  searchHeaderSearch(term$: Observable<string>): Observable<SearchResult[]> {
    return combineLatest([term$, this.users$, this.userChannels$]).pipe(
      map(([term, users, channels]) => {
        const t = (term ?? '').trim().toLowerCase();
        if (!t) return [] as SearchResult[];

        // @ → alle User
        if (t === '@') {
          return users.map((u) => ({ type: 'user' as const, ...u }));
        }

        // # → alle Channels, in denen User Mitglied ist
        if (t === '#') {
          return channels.map((c) => ({ type: 'channel' as const, ...c }));
        }

        // @xyz → User anhand Name
        if (t.startsWith('@')) {
          const query = t.slice(1);
          return users
            .filter((u) => u.name?.toLowerCase().includes(query))
            .map((u) => ({ type: 'user' as const, ...u }));
        }

        // #xyz → Channels anhand Name
        if (t.startsWith('#')) {
          const query = t.slice(1);
          return channels
            .filter((c) => c.name?.toLowerCase().includes(query))
            .map((c) => ({ type: 'channel' as const, ...c }));
        }

        // Standard: User anhand ihrer Mailadresse
        return users
          .filter((u) => u.email?.toLowerCase().includes(t))
          .map((u) => ({ type: 'user' as const, ...u }));
      })
    );
  }
}
