import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { PostSearchInterface } from '../shared/models/postSearch.interface';
import { SearchResult } from '../shared/types/search-result.type';
import { AuthService } from './auth.service';
import { UserInterface } from '../shared/models/user.interface';
import { ChannelInterface } from '../shared/models/channel.interface';
import { PostInterface } from '../shared/models/post.interface';
import { ChatService } from './chat.service';

@Injectable({ providedIn: 'root' })
export class SearchService {
  chatService = inject(ChatService);
  // Local state managed with BehaviorSubjects for real-time updates
  private users$ = new BehaviorSubject<UserInterface[]>([]);
  private channels$ = new BehaviorSubject<ChannelInterface[]>([]);
  private chatPosts$ = new BehaviorSubject<PostInterface[]>([]);
  private channelPosts$ = new BehaviorSubject<PostSearchInterface[]>([]);

  constructor(private firestore: Firestore, private authService: AuthService) {
    this.listenToUsers();
    this.listenToChannels();
    this.listenToChats();
    this.listenToChannelMessages();
  }

  /***
   * Listen to all users in Firestore and keep them updated in users$.
   * Data is cast to UserSearchInterface for search functionality.
   */
  private listenToUsers() {
    const usersCol = collection(this.firestore, 'users');
    collectionData(usersCol, { idField: 'id' }).subscribe(
      (data) => this.users$.next(data as UserInterface[]) // statt UserSearchInterface
    );
  }

  /***
   * Listen to all channels in Firestore that the current user is a member of.
   * Filters out channels where the user is not included.
   */
  private listenToChannels() {
    const currentUserId = this.authService.currentUser?.uid;

    const channelsCol = collection(this.firestore, 'channels');
    collectionData(channelsCol, { idField: 'id' }).subscribe((data: any[]) => {
      if (!currentUserId) {
        this.channels$.next([]);
        return;
      }

      const userChannels = data.filter((channel) =>
        channel.memberIds?.includes(currentUserId)
      );

      this.channels$.next(userChannels as ChannelInterface[]);
    });
  }

  /***
   * Listen to all direct chats for the current user.
   * Loads chat messages and answers nested under each message.
   */
  private listenToChats() {
    const currentUserId = this.authService.currentUser?.uid;
    if (!currentUserId) return;

    const chatsCol = collection(this.firestore, 'chats');
    collectionData(chatsCol, { idField: 'id' }).subscribe((chats: any[]) => {
      // Only include chats where the user is one of the participants
      const userChats = chats.filter((chat) => {
        const [user1, user2] = chat.id.split('_');
        return user1 === currentUserId || user2 === currentUserId;
      });

      userChats.forEach((chat) => {
        const msgCol = collection(this.firestore, `chats/${chat.id}/messages`);
        collectionData(msgCol, { idField: 'id' }).subscribe((msgs: any[]) => {
          // Attach chatId to each message for context
          const enriched = msgs.map((m) => ({ ...m, chatId: chat.id }));
          this.chatPosts$.next([...this.chatPosts$.value, ...enriched]);

          // Also listen for answers to each message
          msgs.forEach((m) => {
            const ansCol = collection(
              this.firestore,
              `chats/${chat.id}/messages/${m.id}/answers`
            );
            collectionData(ansCol, { idField: 'id' }).subscribe(
              (ans: any[]) => {
                const enrichedAns = ans.map((a) => ({
                  ...a,
                  chatId: chat.id, // nur chatId hinzufügen
                }));

                // Direkt in chatPosts$ speichern
                this.chatPosts$.next([
                  ...this.chatPosts$.value,
                  ...enrichedAns,
                ]);
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
          // Attach channelId and channelName for context
          const enriched = msgs.map((m) => ({
            ...m,
            channelId: channel.id,
            channelName: channel.name,
          }));
          this.channelPosts$.next([
            ...this.channelPosts$.value,
            ...enriched,
          ]);

          // Listen for answers inside channel messages
          msgs.forEach((m) => {
            const ansCol = collection(
              this.firestore,
              `channels/${channel.id}/messages/${m.id}/answers`
            );
            collectionData(ansCol, { idField: 'id' }).subscribe(
              (ans: any[]) => {
                const enrichedAns = ans.map((a) => ({
                  ...a,
                  channelId: channel.id,
                  channelName: channel.name,
                }));

                // Direkt in channelPosts$ speichern
                this.channelPosts$.next([
                  ...this.channelPosts$.value,
                  ...enrichedAns,
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
  search(term$: Observable<string>): Observable<SearchResult[]> {
    return combineLatest([
      term$,
      this.users$,
      this.channels$,
      this.chatPosts$,
      this.channelPosts$,
    ]).pipe(
      map(([term, users, channels, chatMessages, channelMessages]) => {
        const t = (term ?? '').toLowerCase();
        if (!t) return [] as SearchResult[];

        return [
          ...users
            .filter(
              (u) =>
                u.name?.toLowerCase().includes(t) ||
                u.email?.toLowerCase().includes(t)
            )
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

              return {
                type: 'chatMessage' as const,
                ...m,
                user: otherUser,
              };
            }),
          ...channelMessages
            .filter((m) => m.text?.toLowerCase().includes(t))
            .map((m) => {
              const channel = channels.find((c) => c.id === m.channelId)!;
              return {
                type: 'channelMessage' as const,
                ...m,
                channel,
              };
            }),
        ];
      })
    );
  }
}
