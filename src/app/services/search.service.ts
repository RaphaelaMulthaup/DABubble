import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { combineLatest, map, Observable, shareReplay, switchMap, filter, distinctUntilChanged, BehaviorSubject, of, throttleTime } from 'rxjs';
import { SearchResult } from '../shared/types/search-result.type';
import { AuthService } from './auth.service';
import { UserInterface } from '../shared/models/user.interface';
import { ChannelInterface } from '../shared/models/channel.interface';
import { PostInterface } from '../shared/models/post.interface';
import { ChatService } from './chat.service';
import { UserDemoSetupService } from './user-demo-setup.service';

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
    private firestore: Firestore,
    private userDemoSetupService: UserDemoSetupService
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
    this.search(term$).subscribe((results) => this.results$.next(results));
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
        const q = this.userDemoSetupService.buildUserChannelsQuery(user.uid);
        return collectionData(q, { idField: 'id' }).pipe(map((data) => data as ChannelInterface[]));
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Returns all chat posts (including answers) for the current user.
   */
  getChatPosts$(): Observable<PostInterface[]> {
    return this.authService.currentUser$.pipe(
      filter((user): user is UserInterface => !!user),
      switchMap((user) => this.getUserChats$(user)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Retrieves all chats of a user and fetches messages including answers.
   */
  getUserChats$(user: UserInterface): Observable<PostInterface[]> {
    const chatsCol = collection(this.firestore, 'chats');
    return collectionData(chatsCol, { idField: 'id' }).pipe(
      switchMap((chats: any[]) => {
        const userChats = this.filterChatsForUser(chats, user.uid);
        if (!userChats.length) return of([]);
        const chatMessages$ = userChats.map((chat) => this.getMessagesForChat$(chat.id));
        return combineLatest(chatMessages$).pipe(map((arrays) => arrays.flat()));
      })
    );
  }

  /**
   * Filters all chat documents to only those including the user.
   */
  filterChatsForUser(chats: any[], userId: string) {
    return chats.filter((chat) => {
      const [user1, user2] = chat.id.split('_');
      return user1 === userId || user2 === userId;
    });
  }

  /**
   * Loads all messages and their answers for a single chat.
   */
  getMessagesForChat$(chatId: string): Observable<PostInterface[]> {
    const msgCol = collection(this.firestore, `chats/${chatId}/messages`);
    return collectionData(msgCol, { idField: 'id' }).pipe(switchMap((msgs: any[]) => {
        const messages = msgs.map((m) => ({ ...(m as PostInterface), chatId }));
        if (!msgs.length) return of(messages);
        const answers$ = msgs.map((msg) => this.getAnswersForMessage$(chatId, msg.id));
        return combineLatest(answers$).pipe( map((answerArrays) => [...messages, ...answerArrays.flat()]));
      }));
  }

  /**
   * Loads all answers for a specific message in a chat.
   */
  getAnswersForMessage$(chatId: string, messageId: string): Observable<PostInterface[]> {
    const ansCol = collection(this.firestore, `chats/${chatId}/messages/${messageId}/answers`);
    return collectionData(ansCol, { idField: 'id' }).pipe(
      map((ans: any[]) =>
        ans.map((a) => ({
          ...(a as PostInterface),
          chatId,
          answer: true,
          parentMessageId: messageId,
        }))
      )
    );
  }

  /**
   * Returns all posts (including answers) for the user's channels.
   */
  getChannelPosts$(): Observable<PostInterface[]> {
    return this.userChannels$.pipe(
      switchMap((channels) => this.loadPostsForChannels$(channels)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Loads all messages and answers for a list of channels.
   */
  loadPostsForChannels$(channels: ChannelInterface[]): Observable<PostInterface[]> {
    if (!channels.length) return of([]);
    const channelMessages$ = channels.map((channel) => this.getMessagesForChannel$(channel));
    return combineLatest(channelMessages$).pipe(map((arrays) => arrays.flat()));
  }

  /**
   * Loads messages and their answers for a single channel.
   */
  getMessagesForChannel$(channel: ChannelInterface): Observable<PostInterface[]> {
    const msgCol = collection(this.firestore, `channels/${channel.id}/messages`);
    return collectionData(msgCol, { idField: 'id' }).pipe(
      switchMap((msgs: any[]) => {
        const messages = msgs.map((m) => ({ ...(m as PostInterface), channelId: channel.id, channelName: channel.name }));
        if (!msgs.length) return of(messages);
        const answers$ = msgs.map((msg) => this.getAnswersForChannelMessage$(channel.id!, msg.id));
        return combineLatest(answers$).pipe(map((answerArrays) => [...messages, ...answerArrays.flat()]));
      })
    );
  }

  /**
   * Loads all answers for a specific message in a channel.
   */
  getAnswersForChannelMessage$(channelId: string, messageId: string): Observable<PostInterface[]> {
    const ansCol = collection(this.firestore, `channels/${channelId}/messages/${messageId}/answers`);
    return collectionData(ansCol, { idField: 'id' }).pipe(map((ans: any[]) => ans.map((a) => ({ ...(a as PostInterface), channelId, answer: true, parentMessageId: messageId }))));
  }

  /**
   * Searches for users, channels, chat messages, and channel messages based on a term.
   * Includes all messages and channels if specified.
   * 
   * @param term$ - Observable emitting the search term entered by the user
   * @param opts - Optional flags for the search. For example, includeAllChannels: true to include all channels
   */
  search(term$: Observable<string>, opts?: { includeAllChannels?: boolean }): Observable<SearchResult[]> {
    return combineLatest([
      this.prepareTerm$(term$),
      this.users$,
      opts?.includeAllChannels ? this.allChannels$ : this.userChannels$,
      this.chatPosts$.pipe(map((posts) => posts.filter((p): p is PostInterface & { chatId: string } => !!p.chatId))),
      this.channelPosts$,
      this.authService.currentUser$.pipe(filter((u): u is UserInterface => !!u))
    ]).pipe(map(([term, users, channels, chatMessages, channelMessages, currentUser]) => this.filterSearchResults(term, users, channels, chatMessages, channelMessages, currentUser)));
  }

  /**
   * Searches only for users and user channels (used for header search).
   * 
   * @param term$ - Observable emitting the search term entered by the user
   */
  searchHeaderSearch(term$: Observable<string>): Observable<SearchResult[]> {
    return combineLatest([
      this.prepareTerm$(term$),
      this.users$,
      this.userChannels$
    ]).pipe(map(([term, users, channels]) => this.filterHeaderSearchResults(term, users, channels)));
  }

  /** 
   * Prepares the search term observable with throttling and distinctUntilChanged.
   * 
   * @param term$ - Observable emitting the search term entered by the user
   */
  prepareTerm$(term$: Observable<string>): Observable<string> {
    return term$.pipe(throttleTime(300, undefined, { leading: true, trailing: true }), distinctUntilChanged());
  }

  /** 
   * Filters results for the full search (messages, channels, users)
   * 
   * @param term - The search term entered by the user
   * @param users - List of all users
   * @param channels - List of all channels
   * @param chatMessages - List of chat messages
   * @param channelMessages - List of channel messages
   * @param currentUser - The currently logged-in user
   */
  filterSearchResults(
    term: string, 
    users: UserInterface[], 
    channels: ChannelInterface[], 
    chatMessages: (PostInterface & { chatId: string })[], 
    channelMessages: PostInterface[], 
    currentUser: UserInterface
  ): SearchResult[] {
    const t = (term ?? '').trim().toLowerCase();
    if (!t) return [];
    if (t === '@') return users.map((u) => ({ type: 'user' as const, ...u }));
    if (t === '#') return channels.map((c) => ({ type: 'channel' as const, ...c }));
    if (t.startsWith('@')) return this.filterUsers(users, t.slice(1));
    if (t.startsWith('#')) return this.filterChannels(channels, t.slice(1));
    return [
      ...this.filterUsers(users, t),
      ...this.filterChannels(channels, t),
      ...this.filterChatMessages(chatMessages, users, t, currentUser),
      ...this.filterChannelMessages(channelMessages, channels, t)
    ];
  }

  /** 
   * Filters results for header search (users and channels only)
   * 
   * @param term - The search term entered by the user
   * @param users - List of all users
   * @param channels - List of user channels
   */
  filterHeaderSearchResults(term: string, users: UserInterface[], channels: ChannelInterface[]): SearchResult[] {
    const t = (term ?? '').trim().toLowerCase();
    if (!t) return [];
    if (t === '@') return users.map((u) => ({ type: 'user' as const, ...u }));
    if (t === '#') return channels.map((c) => ({ type: 'channel' as const, ...c }));
    if (t.startsWith('@')) return this.filterUsers(users, t.slice(1));
    if (t.startsWith('#')) return this.filterChannels(channels, t.slice(1));
    return users.filter((u) => u.email?.toLowerCase().includes(t)).map((u) => ({ type: 'user' as const, ...u }));
  }

  /** 
   * Helper to filter users by name 
   * 
   * @param users - List of users to filter
   * @param query - The query string to match against user names or emails
   */
  filterUsers(users: UserInterface[], query: string): SearchResult[] {
    return users
      .filter((u) => u.name?.toLowerCase().includes(query))
      .map((u) => ({ type: 'user' as const, ...u }));
  }

  /** 
   * Helper to filter channels by name
   * 
   * @param channels - List of channels to filter
   * @param query - The query string to match against channel names
   */
  filterChannels(channels: ChannelInterface[], query: string): SearchResult[] {
    return channels
      .filter((c) => c.name?.toLowerCase().includes(query))
      .map((c) => ({ type: 'channel' as const, ...c }));
  }

  /**
   * Filters chat messages based on the search term.
   *
   * @param chatMessages - List of chat messages with chatId
   * @param users - List of users
   * @param term - The search term
   * @param currentUser - The currently logged-in user
   */
  filterChatMessages(
    chatMessages: (PostInterface & { chatId: string })[],
    users: UserInterface[],
    term: string,
    currentUser: UserInterface
  ): SearchResult[] {
    return chatMessages
      .filter((m) => m.text?.toLowerCase().includes(term))
      .map((m) => {
        const otherUserId = this.chatService.getOtherUserId(m.chatId, currentUser.uid);
        const otherUser = users.find((u) => u.uid === otherUserId)!;
        return { type: 'chatMessage' as const, ...m, user: otherUser };
      });
  }

  /**
   * Filters channel messages based on the search term.
   *
   * @param channelMessages - List of channel messages
   * @param channels - List of channels
   * @param term - The search term
   */
  filterChannelMessages(
    channelMessages: PostInterface[],
    channels: ChannelInterface[],
    term: string
  ): SearchResult[] {
    return channelMessages
      .filter((m) => m.text?.toLowerCase().includes(term))
      .map((m) => {
        const channel = channels.find((c) => c.id === m.channelId)!;
        return { type: 'channelMessage' as const, ...m, channel };
      });
  }
}