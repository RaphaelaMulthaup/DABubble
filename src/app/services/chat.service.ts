import { Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  collectionSnapshots,
  deleteDoc,
  doc,
  DocumentData,
  Firestore,
  getDocs,
  limit,
  query,
  QueryDocumentSnapshot,
  setDoc,
} from '@angular/fire/firestore';
import { ChatInterface } from '../shared/models/chat.interface';
import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  shareReplay,
  take,
} from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { UserInterface } from '../shared/models/user.interface';
import { ScreenService } from './screen.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private chatsCache = new Map<string, Observable<ChatInterface[]>>();
  private _otherUser$ = new BehaviorSubject<UserInterface | null>(null);
  public otherUser$ = this._otherUser$.asObservable();
  previousUrl = '';

  constructor(
    private firestore: Firestore,
    private router: Router,
    public screenService: ScreenService
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const newUrl = event.urlAfterRedirects;
        const wasChatRoute = this.previousUrl.startsWith('/dashboard/chat');
        if (this.previousUrl !== newUrl && wasChatRoute) this.deleteEmptyChat(this.previousUrl);
        this.previousUrl = newUrl;
      });
  }

  /**
   * Creates (or merges) a new chat document between two users in Firestore.
   *
   * @param userId1 - The ID of the first user.
   * @param userId2 - The ID of the second user.
   */
  async createChat(userId1: string, userId2: string) {
    const chatId = await this.getChatId(userId1, userId2);
    const chatRef = doc(this.firestore, 'chats', chatId);

    await setDoc(
      chatRef,
      { chatId: chatId },
      { merge: true }
    );
  }

  /**
   * Returns an observable of all chat documents for a given user.
   * Uses caching to prevent redundant Firestore queries.
   *
   * @param userId - The ID of the user whose chats should be fetched.
   */
  getChatsForUser(userId: string): Observable<ChatInterface[]> {
    if (!this.chatsCache.has(userId)) {
      const chats$ = this.loadChatsFromFirestore(userId);
      this.chatsCache.set(userId, chats$);
    }
    return this.chatsCache.get(userId)!;
  }

  /**
   * Loads chats from Firestore for a given user without caching.
   * Filters chat documents by user ID and maps them to ChatInterface objects.
   *
   * @param userId - The ID of the user whose chats should be loaded.
   */
  loadChatsFromFirestore(userId: string): Observable<ChatInterface[]> {
    return collectionSnapshots(collection(this.firestore, 'chats'))
      .pipe(
        map((snaps) => snaps
            .filter((snap) => snap.id.includes(userId))
            .map((snap) => {
              const data = snap.data() as Omit<ChatInterface, 'id'>;
              const id = snap.id;
              return { id, ...data };
            })
        ),
        distinctUntilChanged((a, b) => a.length === b.length && a.every((chat, i) => chat.id === b[i].id)),
        shareReplay({ bufferSize: 1, refCount: true })
      );
  }

  /**
   * Retrieves all chat document references that include the given user ID.
   * Returns a promise resolving to an array of chat document snapshots matching the user.
   * 
   * @param userId - The ID of the user to search for in chat document IDs.
   */
  async getChatRefsForUser(
    userId: string
  ): Promise<QueryDocumentSnapshot<DocumentData>[]> {
    const chatsRef = collection(this.firestore, 'chats');
    const snaps = await getDocs(chatsRef);
    return snaps.docs.filter((snap) => snap.id.includes(userId));
  }

  /**
   * Generates a unique chat ID for two users and returns it as a string.
   * The chat ID is created by sorting the two user IDs alphabetically and joining them with an underscore. 
   *
   * @param userId1 - The first user's ID.
   * @param userId2 - The second user's ID.
   */
  async getChatId(userId1: string, userId2: string):Promise<string> {
    const sortedIds = [userId1, userId2].sort();
    return `${sortedIds[0]}_${sortedIds[1]}`;
  }

  /**
   * Extracts the other participant's user ID from a chat ID and returns it.
   *
   * @param chatId - The chat ID string (combination of two user IDs).
   * @param currentUserId - The ID of the currently logged-in user.
   */
  getOtherUserId(chatId: string, currentUserId: string): string {
    const [userA, userB] = chatId.split('_');
    return userA == currentUserId ? userB : userA;
  }

  /**
   * Deletes a chat document by its chat ID.
   *
   * @param chatId - The ID of the chat to delete.
   */
  deleteChat(chatId: string): Promise<void> {
    const chatRef = doc(this.firestore, 'chats', chatId);
    return deleteDoc(chatRef);
  }

  /**
   * Deletes a chat if it is empty and not a self-chat.
   * 
   * @param url - The URL containing the chat ID.
   */
  deleteEmptyChat(url: string) {
    const segments = url.split('/');
    const chatId = segments[3];
    const parts = chatId.split('_');
    if (parts[0] === parts[1]) {
      return;
    } else {
      this.isChatEmpty(chatId)
        .pipe(take(1))
        .subscribe((isEmpty) => {if (isEmpty) this.deleteChat(chatId)});
    }
  }

  /**
   * Checks whether a chat has no messages.
   *
   * @param chatId - The ID of the chat to check.
   */
  isChatEmpty(chatId: string): Observable<boolean> {
    const path = `/chats/${chatId}/messages`;
    const ref = collection(this.firestore, path);
    const q = query(ref, limit(1));
    return collectionData(q).pipe(map((docs) => docs.length === 0));
  }

  /**
   * Navigates the user to a direct chat with another user.  
   * If the chat does not exist, it will be created first.
   *
   * @param currentUserId - The ID of the current user.
   * @param otherUser - The user to start or continue the chat with.
   */
  async navigateToChat(currentUserId: string, otherUser: UserInterface) {
    const chatId = await this.getChatId(currentUserId, otherUser.uid);
    await this.createChat(currentUserId, otherUser.uid);
    this.setOtherUser(otherUser);
    this.screenService.setDashboardState('message-window');
    this.router.navigate(['/dashboard', 'chat', chatId]);
  }

  /**
   * Sets the other user for the current chat session.
   *
   * @param user - The user object of the other participant in the chat.
   */
  setOtherUser(user: UserInterface) {
    this._otherUser$.next(user);
  }
}