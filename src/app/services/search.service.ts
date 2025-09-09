import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay, switchMap, filter } from 'rxjs';
import { SearchResult } from '../shared/types/search-result.type';
import { AuthService } from './auth.service';
import { UserInterface } from '../shared/models/user.interface';
import { ChannelInterface } from '../shared/models/channel.interface';
import { PostInterface } from '../shared/models/post.interface';
import { ChatService } from './chat.service';

@Injectable({ providedIn: 'root' })
export class SearchService {
  // Öffentliche Observables für Components
  public readonly users$: Observable<UserInterface[]>;
  public readonly allChannels$: Observable<ChannelInterface[]>;
  public readonly userChannels$: Observable<ChannelInterface[]>;
  public readonly chatPosts$: Observable<PostInterface[]>;
  public readonly channelPosts$: Observable<PostInterface[]>;

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private chatService: ChatService
  ) {
    // Initialisiere alle Datenströme
    this.users$ = this.getUsers$();
    this.allChannels$ = this.getAllChannels$();
    this.userChannels$ = this.getUserChannels$();
    this.chatPosts$ = this.getChatPosts$();
    this.channelPosts$ = this.getChannelPosts$();
  }

  private getUsers$(): Observable<UserInterface[]> {
    const usersCol = collection(this.firestore, 'users');
    return collectionData(usersCol, { idField: 'id' }).pipe(
      map(data => data as UserInterface[]),
      shareReplay(1) // Teilt das Abonnement für mehrere Consumer
    );
  }

  private getAllChannels$(): Observable<ChannelInterface[]> {
    const channelsCol = collection(this.firestore, 'channels');
    return collectionData(channelsCol, { idField: 'id' }).pipe(
      map(data => data as ChannelInterface[]),
      shareReplay(1)
    );
  }

  private getUserChannels$(): Observable<ChannelInterface[]> {
    return this.authService.currentUser$.pipe(
      filter(user => !!user),
      switchMap(user => {
        const channelsCol = collection(this.firestore, 'channels');
        return collectionData(channelsCol, { idField: 'id' }).pipe(
          map((data: any[]) => {
            return data.filter(channel => 
              channel.memberIds?.includes(user.uid)
            ) as ChannelInterface[];
          })
        );
      }),
      shareReplay(1)
    );
  }

  private getChatPosts$(): Observable<PostInterface[]> {
    return this.authService.currentUser$.pipe(
      filter(user => !!user),
      switchMap(user => {
        const chatsCol = collection(this.firestore, 'chats');
        return collectionData(chatsCol, { idField: 'id' }).pipe(
          switchMap((chats: any[]) => {
            const userChats = chats.filter(chat => {
              const [user1, user2] = chat.id.split('_');
              return user1 === user.uid || user2 === user.uid;
            });

            if (userChats.length === 0) {
              return [[]];
            }

            const chatMessages$ = userChats.map(chat => {
              const msgCol = collection(this.firestore, `chats/${chat.id}/messages`);
              return collectionData(msgCol, { idField: 'id' }).pipe(
                switchMap((msgs: any[]) => {
                  const messages = msgs.map(m => ({
                    ...(m as PostInterface),
                    chatId: chat.id
                  }));

                  if (msgs.length === 0) {
                    return [messages];
                  }

                  const answers$ = msgs.map(msg => {
                    const ansCol = collection(
                      this.firestore,
                      `chats/${chat.id}/messages/${msg.id}/answers`
                    );
                    return collectionData(ansCol, { idField: 'id' }).pipe(
                      map((ans: any[]) => ans.map(a => ({
                        ...(a as PostInterface),
                        chatId: chat.id,
                        answer: true,
                        parentMessageId: msg.id
                      })))
                    );
                  });

                  return combineLatest(answers$).pipe(
                    map(answerArrays => {
                      const allAnswers = answerArrays.flat();
                      return [...messages, ...allAnswers];
                    })
                  );
                })
              );
            });

            return combineLatest(chatMessages$).pipe(
              map(arrays => arrays.flat())
            );
          })
        );
      }),
      shareReplay(1)
    );
  }

  private getChannelPosts$(): Observable<PostInterface[]> {
    return this.userChannels$.pipe(
      switchMap(channels => {
        if (channels.length === 0) {
          return [[]];
        }

        const channelMessages$ = channels.map(channel => {
          const msgCol = collection(
            this.firestore,
            `channels/${channel.id}/messages`
          );
          return collectionData(msgCol, { idField: 'id' }).pipe(
            switchMap((msgs: any[]) => {
              const messages = msgs.map(m => ({
                ...m,
                channelId: channel.id,
                channelName: channel.name
              }));

              if (msgs.length === 0) {
                return [messages];
              }

              const answers$ = msgs.map(msg => {
                const ansCol = collection(
                  this.firestore,
                  `channels/${channel.id}/messages/${msg.id}/answers`
                );
                return collectionData(ansCol, { idField: 'id' }).pipe(
                  map((ans: any[]) => ans.map(a => ({
                    ...(a as PostInterface),
                    channelId: channel.id,
                    answer: true,
                    parentMessageId: msg.id
                  })))
                );
              });

              return combineLatest(answers$).pipe(
                map(answerArrays => {
                  const allAnswers = answerArrays.flat();
                  return [...messages, ...allAnswers];
                })
              );
            })
          );
        });

        return combineLatest(channelMessages$).pipe(
          map(arrays => arrays.flat())
        );
      }),
      shareReplay(1)
    );
  }

  search(
    term$: Observable<string>,
    opts?: { includeAllChannels?: boolean }
  ): Observable<SearchResult[]> {
    const channels$ = opts?.includeAllChannels ? this.allChannels$ : this.userChannels$;

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

        return users
          .filter((u) => u.email?.toLowerCase().includes(t))
          .map((u) => ({ type: 'user' as const, ...u }));
      })
    );
  }
}

