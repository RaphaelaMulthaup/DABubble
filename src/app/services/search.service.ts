import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData
} from '@angular/fire/firestore';
import {
  combineLatest,
  map,
  Observable,
  shareReplay,
  switchMap,
  filter,
  distinctUntilChanged,
  BehaviorSubject,
  of,
  throttleTime,
} from 'rxjs';
import { SearchResult } from '../shared/types/search-result.type';
import { AuthService } from './auth.service';
import { UserInterface } from '../shared/models/user.interface';
import { ChannelInterface } from '../shared/models/channel.interface';
import { PostInterface } from '../shared/models/post.interface';
import { ChatService } from './chat.service';

@Injectable({ providedIn: 'root' })
export class SearchService {
  users$: Observable<UserInterface[]>;
  allChannels$: Observable<ChannelInterface[]>;
  userChannels$: Observable<ChannelInterface[]>;
  chatPosts$: Observable<PostInterface[]>;
  channelPosts$: Observable<PostInterface[]>;
  results$ = new BehaviorSubject<SearchResult[]>([]);

  overlaySearchResultsOpen = false;
  overlaySearchResultsNewMessageOpen = false;

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private firestore: Firestore
  ) {
    this.users$ = this.getUsers$();
    this.allChannels$ = this.getAllChannels$();
    this.userChannels$ = this.getUserChannels$();
    this.chatPosts$ = this.getChatPosts$();
    this.channelPosts$ = this.getChannelPosts$();
  }

  /**
   * Subscribes to a search term observable and updates the internal results stream.
   *
   * @param term$ - Observable emitting the search term strings.
   */
  updateResults(term$: Observable<string>) {
    this.search(term$).subscribe((results) => {this.results$.next(results);});
  }

  /**
   * Fetches the list of all users from Firestore.
   * Returns an Observable array of UserInterface objects.
   */
  getUsers$(): Observable<UserInterface[]> {
    const usersCol = collection(this.firestore, 'users');
    return collectionData(usersCol, { idField: 'id' }).pipe(
      map((data) => data as UserInterface[]),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Fetches the list of all channels from Firestore.
   * Returns an Observable array of ChannelInterface objects.
   */
  getAllChannels$(): Observable<ChannelInterface[]> {
    const channelsCol = collection(this.firestore, 'channels');
    return collectionData(channelsCol, { idField: 'id' }).pipe(
      map((data) => data as ChannelInterface[]),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Fetches channels that the current authenticated user is a member of.
   * Returns an Observable array of ChannelInterface objects.
   */
  getUserChannels$(): Observable<ChannelInterface[]> {
    return this.authService.currentUser$.pipe(
      filter((user): user is UserInterface => !!user),
      distinctUntilChanged((a, b) => a.uid === b.uid),
      switchMap((user) => {
        const q = this.authService.buildUserChannelsQuery(user.uid);
        return collectionData(q, { idField: 'id' }).pipe(
          map((data) => data as ChannelInterface[])
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Fetches chat posts for the current user.
   * Returns an Observable array of PostInterface objects representing the chat posts.
   */
  getChatPosts$(): Observable<PostInterface[]> {
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

            if (!userChats.length) return of([]);
            const chatMessages$ = userChats.map((chat) => {
              const msgCol = collection(
                this.firestore,
                `chats/${chat.id}/messages`
              );
              return collectionData(msgCol, { idField: 'id' }).pipe(
                switchMap((msgs: any[]) => {
                  const messages = msgs.map((m) => ({
                    ...(m as PostInterface),
                    chatId: chat.id,
                  }));

                  if (!msgs.length) return of(messages);
                  const answers$ = msgs.map((msg) => {
                    const ansCol = collection(
                      this.firestore,
                      `chats/${chat.id}/messages/${msg.id}/answers`
                    );
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

                  return combineLatest(answers$).pipe(
                    map((answerArrays) => [...messages, ...answerArrays.flat()])
                  );
                })
              );
            });

            return combineLatest(chatMessages$).pipe(
              map((arrays) => arrays.flat())
            );
          })
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Fetches posts from channels the user is a member of.
   * Returns an Observable array of PostInterface objects representing the posts in the channels.
   */
  getChannelPosts$(): Observable<PostInterface[]> {
    return this.userChannels$.pipe(
      switchMap((channels) => {
        if (!channels.length) return of([]);
        const channelMessages$ = channels.map((channel) => {
          const msgCol = collection(
            this.firestore,
            `channels/${channel.id}/messages`
          );
          return collectionData(msgCol, { idField: 'id' }).pipe(
            switchMap((msgs: any[]) => {
              const messages = msgs.map((m) => ({
                ...m,
                channelId: channel.id,
                channelName: channel.name,
              }));

              if (!msgs.length) return of(messages);
              const answers$ = msgs.map((msg) => {
                const ansCol = collection(
                  this.firestore,
                  `channels/${channel.id}/messages/${msg.id}/answers`
                );
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

              return combineLatest(answers$).pipe(
                map((answerArrays) => [...messages, ...answerArrays.flat()])
              );
            })
          );
        });

        return combineLatest(channelMessages$).pipe(
          map((arrays) => arrays.flat())
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  search( term$: Observable<string>, opts?: { includeAllChannels?: boolean }): Observable<SearchResult[]> {
    return combineLatest([
      term$.pipe(
        throttleTime(300, undefined, { leading: true, trailing: true }),
        distinctUntilChanged()
      ),
      this.users$,
      opts?.includeAllChannels ? this.allChannels$ : this.userChannels$,
      this.chatPosts$,
      this.channelPosts$,
      this.authService.currentUser$.pipe(
        filter((u): u is UserInterface => !!u)
      ),
    ]).pipe(
      map(([term, users, channels, chatMessages, channelMessages, user]) => {
        const t = (term ?? '').trim().toLowerCase();
        if (!t) return [] as SearchResult[];

        if (t === '@')
          return users.map((u) => ({ type: 'user' as const, ...u }));
        if (t === '#')
          return channels.map((c) => ({ type: 'channel' as const, ...c }));

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
                user.uid
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

  /**
   * Searches for users and channels based on the provided search term.
   * This method is specifically used for header search, focusing only on users and user channels.
   *
   * @param term$ An observable that emits the search term.
   */
  searchHeaderSearch(term$: Observable<string>): Observable<SearchResult[]> {
    return combineLatest([
      term$.pipe(
        throttleTime(300, undefined, { leading: true, trailing: true }),
        distinctUntilChanged()
      ),
      this.users$,
      this.userChannels$,
    ]).pipe(
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
