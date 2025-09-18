import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import {
  combineLatest,
  map,
  Observable,
  shareReplay,
  switchMap,
  filter,
  BehaviorSubject,
  of,
} from 'rxjs';
import { SearchResult } from '../shared/types/search-result.type';
import { AuthService } from './auth.service';
import { UserInterface } from '../shared/models/user.interface';
import { ChannelInterface } from '../shared/models/channel.interface';
import { PostInterface } from '../shared/models/post.interface';
import { ChatService } from './chat.service';

@Injectable({ providedIn: 'root' })
export class SearchService {
  public readonly users$: Observable<UserInterface[]>;
  public readonly allChannels$: Observable<ChannelInterface[]>;
  public readonly userChannels$: Observable<ChannelInterface[]>;
  public readonly chatPosts$: Observable<PostInterface[]>;
  public readonly channelPosts$: Observable<PostInterface[]>;
  public readonly results$ = new BehaviorSubject<SearchResult[]>([]);

  overlaySearchResultsOpen = false;
  overlaySearchResultsNewMessageOpen = false;

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private chatService: ChatService
  ) {
    // Initialize observables on service creation
    this.users$ = this.getUsers$();
    this.allChannels$ = this.getAllChannels$();
    this.userChannels$ = this.getUserChannels$();
    this.chatPosts$ = this.getChatPosts$();
    this.channelPosts$ = this.getChannelPosts$();
  }

  /*** Updates the results BehaviorSubject with the current search term ***/
  updateResults(term$: Observable<string>) {
    this.search(term$).subscribe((results) => this.results$.next(results));
  }

  /*** Fetch all users from Firestore and cache the result ***/
  private getUsers$(): Observable<UserInterface[]> {
    const usersCol = collection(this.firestore, 'users');
    return collectionData(usersCol, { idField: 'id' }).pipe(
      map((data) => data as UserInterface[]),
      shareReplay(1) // Cache the latest emitted value for new subscribers
    );
  }

  /*** Fetch all channels from Firestore and cache the result ***/
  private getAllChannels$(): Observable<ChannelInterface[]> {
    const channelsCol = collection(this.firestore, 'channels');
    return collectionData(channelsCol, { idField: 'id' }).pipe(
      map((data) => data as ChannelInterface[]),
      shareReplay(1)
    );
  }

  /*** Fetch channels where the current user is a member ***/
  private getUserChannels$(): Observable<ChannelInterface[]> {
    return this.authService.currentUser$.pipe(
      filter((user): user is UserInterface => !!user), // Only proceed if user exists
      switchMap((user) => {
        const channelsCol = collection(this.firestore, 'channels');
        return collectionData(channelsCol, { idField: 'id' }).pipe(
          map((data: any[]) =>
            data.filter((channel) => channel.memberIds?.includes(user.uid)) as ChannelInterface[]
          )
        );
      }),
      shareReplay(1)
    );
  }

  /*** Fetch chat messages for all chats the current user is part of, including answers to messages ***/
  private getChatPosts$(): Observable<PostInterface[]> {
    return this.authService.currentUser$.pipe(
      filter((user): user is UserInterface => !!user),
      switchMap((user) => {
        const chatsCol = collection(this.firestore, 'chats');
        return collectionData(chatsCol, { idField: 'id' }).pipe(
          switchMap((chats: any[]) => {
            const userChats = chats.filter((chat) => {
              const [user1, user2] = chat.id.split('_');
              return user1 === user.uid || user2 === user.uid;
            });

            if (!userChats.length) return of([]); // Return empty if user has no chats

            const chatMessages$ = userChats.map((chat) => {
              const msgCol = collection(this.firestore, `chats/${chat.id}/messages`);
              return collectionData(msgCol, { idField: 'id' }).pipe(
                switchMap((msgs: any[]) => {
                  const messages = msgs.map((m) => ({ ...(m as PostInterface), chatId: chat.id }));

                  if (!msgs.length) return of(messages);

                  const answers$ = msgs.map((msg) => {
                    const ansCol = collection(this.firestore, `chats/${chat.id}/messages/${msg.id}/answers`);
                    return collectionData(ansCol, { idField: 'id' }).pipe(
                      map((ans: any[]) =>
                        ans.map((a) => ({
                          ...(a as PostInterface),
                          chatId: chat.id,
                          answer: true,
                          parentMessageId: msg.id,
                        }))
                      )
                    );
                  });

                  return combineLatest(answers$).pipe(map((answerArrays) => [...messages, ...answerArrays.flat()]));
                })
              );
            });

            return combineLatest(chatMessages$).pipe(map((arrays) => arrays.flat()));
          })
        );
      }),
      shareReplay(1)
    );
  }

  /*** Fetch messages from channels that the current user belongs to, including answers ***/
  private getChannelPosts$(): Observable<PostInterface[]> {
    return this.userChannels$.pipe(
      switchMap((channels) => {
        if (!channels.length) return of([]); // Return empty if no user channels

        const channelMessages$ = channels.map((channel) => {
          const msgCol = collection(this.firestore, `channels/${channel.id}/messages`);
          return collectionData(msgCol, { idField: 'id' }).pipe(
            switchMap((msgs: any[]) => {
              const messages = msgs.map((m) => ({ ...m, channelId: channel.id, channelName: channel.name }));

              if (!msgs.length) return of(messages);

              const answers$ = msgs.map((msg) => {
                const ansCol = collection(this.firestore, `channels/${channel.id}/messages/${msg.id}/answers`);
                return collectionData(ansCol, { idField: 'id' }).pipe(
                  map((ans: any[]) =>
                    ans.map((a) => ({
                      ...(a as PostInterface),
                      channelId: channel.id,
                      answer: true,
                      parentMessageId: msg.id,
                    }))
                  )
                );
              });

              return combineLatest(answers$).pipe(map((answerArrays) => [...messages, ...answerArrays.flat()]));
            })
          );
        });

        return combineLatest(channelMessages$).pipe(map((arrays) => arrays.flat()));
      }),
      shareReplay(1)
    );
  }

  /*** Perform search across users, channels, chat messages, and channel messages ***/
  search(term$: Observable<string>, opts?: { includeAllChannels?: boolean }): Observable<SearchResult[]> {
    const channels$ = opts?.includeAllChannels ? this.allChannels$ : this.userChannels$;

    return combineLatest([term$, this.users$, channels$, this.chatPosts$, this.channelPosts$]).pipe(
      switchMap(([term, users, channels, chatMessages, channelMessages]) =>
        this.authService.currentUser$.pipe(
          filter((user): user is UserInterface => !!user),
          map((user) => {
            const t = (term ?? '').trim().toLowerCase();
            if (!t) return [] as SearchResult[];

            if (t === '@') return users.map((u) => ({ type: 'user' as const, ...u }));
            if (t === '#') return channels.map((c) => ({ type: 'channel' as const, ...c }));

            if (t.startsWith('@')) {
              const query = t.slice(1);
              return users.filter((u) => u.name?.toLowerCase().includes(query)).map((u) => ({ type: 'user' as const, ...u }));
            }

            if (t.startsWith('#')) {
              const query = t.slice(1);
              return channels.filter((c) => c.name?.toLowerCase().includes(query)).map((c) => ({ type: 'channel' as const, ...c }));
            }

            return [
              ...users.filter((u) => u.name?.toLowerCase().includes(t)).map((u) => ({ type: 'user' as const, ...u })),
              ...channels.filter((c) => c.name?.toLowerCase().includes(t)).map((c) => ({ type: 'channel' as const, ...c })),
              ...chatMessages
                .filter((m): m is PostInterface & { chatId: string } => !!m.chatId && m.text?.toLowerCase().includes(t))
                .map((m) => {
                  const otherUserId = this.chatService.getOtherUserId(m.chatId, user.uid);
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
        )
      )
    );
  }

  /*** Simplified search for header input: searches only users and channels ***/
  searchHeaderSearch(term$: Observable<string>): Observable<SearchResult[]> {
    return combineLatest([term$, this.users$, this.userChannels$]).pipe(
      map(([term, users, channels]) => {
        const t = (term ?? '').trim().toLowerCase();
        if (!t) return [] as SearchResult[];

        if (t === '@') return users.map((u) => ({ type: 'user' as const, ...u }));
        if (t === '#') return channels.map((c) => ({ type: 'channel' as const, ...c }));

        if (t.startsWith('@')) {
          const query = t.slice(1);
          return users.filter((u) => u.name?.toLowerCase().includes(query)).map((u) => ({ type: 'user' as const, ...u }));
        }

        if (t.startsWith('#')) {
          const query = t.slice(1);
          return channels.filter((c) => c.name?.toLowerCase().includes(query)).map((c) => ({ type: 'channel' as const, ...c }));
        }

        return users.filter((u) => u.email?.toLowerCase().includes(t)).map((u) => ({ type: 'user' as const, ...u }));
      })
    );
  }
}
