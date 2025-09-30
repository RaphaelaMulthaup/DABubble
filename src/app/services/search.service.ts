import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  where,
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
  // Public Observables for Components
  public users$: Observable<UserInterface[]>; // Observable for user data
  public allChannels$: Observable<ChannelInterface[]>; // Observable for all available channels
  public userChannels$: Observable<ChannelInterface[]>; // Observable for channels the current user is a member of
  public chatPosts$: Observable<PostInterface[]>; // Observable for posts in the user's chats
  public channelPosts$: Observable<PostInterface[]>; // Observable for posts in the user's channels
  public results$ = new BehaviorSubject<SearchResult[]>([]);

  overlaySearchResultsOpen = false;
  overlaySearchResultsNewMessageOpen = false;

  constructor(
    private authService: AuthService, // AuthService to manage authentication
    private chatService: ChatService, // ChatService to manage chat-related logic
    private firestore: Firestore // Firestore service to interact with the database
  ) {
    // Initialize all data streams (Observables)
    this.users$ = this.getUsers$(); // Fetch users
    this.allChannels$ = this.getAllChannels$(); // Fetch all channels
    this.userChannels$ = this.getUserChannels$(); // Fetch channels the current user belongs to
    this.chatPosts$ = this.getChatPosts$(); // Fetch chat posts for the user
    this.channelPosts$ = this.getChannelPosts$(); // Fetch channel posts for the user
  }

  /**
   * Subscribes to the provided search term Observable and updates the results$ BehaviorSubject.
   * This method triggers a new search whenever the search term changes and pushes the
   * resulting array of SearchResult objects into the results$ stream for components to consume.
   *
   * @param term$ An Observable that emits the current search term entered by the user.
   */
  updateResults(term$: Observable<string>) {
    this.search(term$).subscribe((results) => {
      this.results$.next(results);
    });
  }

  /**
   * Fetches the list of all users from Firestore.
   * @returns An observable array of UserInterface objects.
   */
  private getUsers$(): Observable<UserInterface[]> {
    const usersCol = collection(this.firestore, 'users'); // Reference to the "users" collection in Firestore
    return collectionData(usersCol, { idField: 'id' }).pipe(
      // Fetch data and include 'id' as an additional field
      map((data) => data as UserInterface[]),
      shareReplay({ bufferSize: 1, refCount: true }) // Cache the latest emitted value for new subscribers
    );
  }

  /**
   * Fetches the list of all channels from Firestore.
   * @returns An observable array of ChannelInterface objects.
   */
  private getAllChannels$(): Observable<ChannelInterface[]> {
    const channelsCol = collection(this.firestore, 'channels'); // Reference to "channels" collection
    return collectionData(channelsCol, { idField: 'id' }).pipe(
      map((data) => data as ChannelInterface[]),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Fetches channels that the current authenticated user is a member of.
   * @returns An observable array of ChannelInterface objects.
   */
  getUserChannels$(): Observable<ChannelInterface[]> {
    return this.authService.currentUser$.pipe(
      filter((user): user is UserInterface => !!user),
      distinctUntilChanged((a, b) => a.uid === b.uid),
      switchMap((user) => {
        const q = query(
          collection(this.firestore, 'channels'),
          where('memberIds', 'array-contains', user.uid)
        );
        return collectionData(q, { idField: 'id' }).pipe(
          map((data) => data as ChannelInterface[])
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Fetches chat posts for the current user.
   * @returns An observable array of PostInterface objects representing the chat posts.
   */
  private getChatPosts$(): Observable<PostInterface[]> {
    return this.authService.currentUser$.pipe(
      filter((user): user is UserInterface => !!user),
      switchMap((user) => {
        const chatsCol = collection(this.firestore, 'chats'); // Reference to the "chats" collection
        return collectionData(chatsCol, { idField: 'id' }).pipe(
          switchMap((chats: any[]) => {
            // Filter chats where the current user is a participant
            const userChats = chats.filter((chat) => {
              const [user1, user2] = chat.id.split('_'); // Split the chat ID to get the two users
              return user1 === user.uid || user2 === user.uid; // Check if the user is part of the chat
            });

            if (!userChats.length) return of([]); // Return empty if user has no chats
            // Create an observable for each chat's messages
            const chatMessages$ = userChats.map((chat) => {
              const msgCol = collection(
                this.firestore,
                `chats/${chat.id}/messages`
              ); // Reference to messages in the chat
              return collectionData(msgCol, { idField: 'id' }).pipe(
                switchMap((msgs: any[]) => {
                  // Map the messages and add the chat ID
                  const messages = msgs.map((m) => ({
                    ...(m as PostInterface),
                    chatId: chat.id,
                  }));

                  if (!msgs.length) return of(messages);
                  // Get the answers to each message in the chat
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
                          answer: true, // Mark this as an answer
                          parentMessageId: msg.id, // Link the answer to its parent message
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
              map((arrays) => arrays.flat()) // Flatten the array of arrays into a single array
            );
          })
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true }) // Share the subscription for multiple consumers
    );
  }

  /**
   * Fetches posts from channels the user is a member of.
   * @returns An observable array of PostInterface objects representing the posts in the channels.
   */
  private getChannelPosts$(): Observable<PostInterface[]> {
    return this.userChannels$.pipe(
      // Use the userChannels$ observable
      switchMap((channels) => {
        if (!channels.length) return of([]); // Return empty if no user channels
        // Create an observable for each channel's messages
        const channelMessages$ = channels.map((channel) => {
          const msgCol = collection(
            this.firestore,
            `channels/${channel.id}/messages`
          ); // Reference to the channel's messages
          return collectionData(msgCol, { idField: 'id' }).pipe(
            switchMap((msgs: any[]) => {
              // Map the messages and add the channel details
              const messages = msgs.map((m) => ({
                ...m,
                channelId: channel.id,
                channelName: channel.name,
              }));

              if (!msgs.length) return of(messages);
              // Get the answers to each message in the channel
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
                      answer: true, // Mark this as an answer
                      parentMessageId: msg.id, // Link the answer to its parent message
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
          map((arrays) => arrays.flat()) // Flatten the array of arrays into a single array
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true }) // Share the subscription for multiple consumers
    );
  }

  search(
    term$: Observable<string>,
    opts?: { includeAllChannels?: boolean }
  ): Observable<SearchResult[]> {
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
   * @returns An observable array of search results (users and channels).
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
        if (!t) return [] as SearchResult[]; // Return an empty array if the search term is empty

        // If the search term is "@" or "#", return all users or channels respectively
        if (t === '@') {
          return users.map((u) => ({ type: 'user' as const, ...u }));
        }

        if (t === '#') {
          return channels.map((c) => ({ type: 'channel' as const, ...c }));
        }

        // Search for users or channels starting with "@" or "#"
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

        // Search for users by email
        return users
          .filter((u) => u.email?.toLowerCase().includes(t))
          .map((u) => ({ type: 'user' as const, ...u }));
      })
    );
  }
}
