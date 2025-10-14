import { Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  collectionSnapshots,
  deleteDoc,
  doc,
  DocumentData,
  documentId,
  Firestore,
  getDocs,
  limit,
  query,
  QueryDocumentSnapshot,
  setDoc,
  where,
} from '@angular/fire/firestore';
import { ChatInterface } from '../shared/models/chat.interface'; // Interface for chat data
import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  of,
  shareReplay,
  Subscription,
  take,
} from 'rxjs';
import { NavigationEnd, Router } from '@angular/router'; // Router to navigate within the app
import { UserInterface } from '../shared/models/user.interface'; // Interface for user data
import { ScreenService } from './screen.service';

@Injectable({
  providedIn: 'root', // The service is provided in the root module
})
export class ChatService {
  /**
   * Private BehaviorSubject to hold the current other user in the chat.
   * It is exposed as an observable for other components to subscribe to.
   */
  private chatsCache = new Map<string, Observable<ChatInterface[]>>();
  // private chatSubscriptions: Subscription[] = [];
  private _otherUser$ = new BehaviorSubject<UserInterface | null>(null);
  public otherUser$ = this._otherUser$.asObservable(); // Public observable for other user
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
        if (this.previousUrl !== newUrl && wasChatRoute) {
          this.deleteEmptyChat(this.previousUrl);
        }
        this.previousUrl = newUrl;
      });
  }

  /**
   * Creates (or merges) a new chat document between two users in Firestore.
   *
   * The chat ID is generated deterministically using {@link getChatId}, ensuring
   * that there will never be duplicate chats for the same two users.
   *
   * @param userId1 - The ID of the first user.
   * @param userId2 - The ID of the second user.
   * @returns A Promise that resolves once the chat document has been written.
   */
  async createChat(userId1: string, userId2: string) {
    const chatId = await this.getChatId(userId1, userId2); // Get the unique chat ID
    const chatRef = doc(this.firestore, 'chats', chatId); // Reference to the Firestore chat document

    await setDoc(
      chatRef,
      {
        chatId: chatId, // Store the chat ID inside the document as well
      },
      { merge: true } // Merge data if the document already exists
    );
  }

  /**
   * Retrieves all chats in which the specified user participates.
   *
   * The method listens to snapshot updates in the "chats" collection and filters
   * only those chats whose document ID contains the given user ID.
   *
   * @param userId - The ID of the user.
   * @returns An observable emitting an array of chats with their document IDs included.
   */
  getChatsForUser(userId: string): Observable<ChatInterface[]> {
    if (!this.chatsCache.has(userId)) {
      const chats$ = collectionSnapshots(
        collection(this.firestore, 'chats')
      ).pipe(
        map((snaps) =>
          snaps
            // Filter über die wiederverwendbare Funktion
            .filter((snap) => snap.id.includes(userId))
            .map((snap) => {
              const data = snap.data() as Omit<ChatInterface, 'id'>;
              const id = snap.id;
              return { id, ...data };
            })
        ),
        distinctUntilChanged(
          (a, b) =>
            a.length === b.length && a.every((chat, i) => chat.id === b[i].id)
        ),
        shareReplay({ bufferSize: 1, refCount: true })
      );

      // const sub = chats$.subscribe();
      // this.chatSubscriptions.push(sub);
      this.chatsCache.set(userId, chats$);
    }
    return this.chatsCache.get(userId)!;
  }

  async getChatRefsForUser(
    userId: string
  ): Promise<QueryDocumentSnapshot<DocumentData>[]> {
    const chatsRef = collection(this.firestore, 'chats');
    const snaps = await getDocs(chatsRef); // einmalige Abfrage aller Dokumente
    return snaps.docs.filter((snap) => snap.id.includes(userId)); // filtert nach userId
  }
  /**
   * Generates a unique chat ID for two users.
   *
   * The chat ID is created by sorting the two user IDs alphabetically
   * and joining them with an underscore. This ensures that the order
   * of user IDs does not affect the resulting chat ID.
   *
   * @param userId1 - The first user's ID.
   * @param userId2 - The second user's ID.
   * @returns A string representing the unique chat ID for the two users.
   */
  async getChatId(userId1: string, userId2: string) {
    // Sort the user IDs alphabetically to ensure the order doesn't affect the chat ID
    const sortedIds = [userId1, userId2].sort();
    return `${sortedIds[0]}_${sortedIds[1]}`; // Join the sorted IDs with an underscore
  }

  /**
   * Extracts the other participant's user ID from a chat ID.
   *
   * Given a chat ID in the format "userA_userB" and the current user's ID,
   * this method returns the ID of the other user.
   *
   * @param chatId - The chat ID string (combination of two user IDs).
   * @param currentUserId - The ID of the currently logged-in user.
   * @returns The ID of the other user in the chat.
   */
  getOtherUserId(chatId: string, currentUserId: string): string {
    const [userA, userB] = chatId.split('_'); // Split the chat ID into two user IDs
    return userA == currentUserId ? userB : userA; // Return the other user's ID
  }

  /**
   * Deletes a chat document by its chat ID.
   *
   * @param chatId - The ID of the chat to delete.
   * @returns A Promise that resolves when the chat has been deleted.
   */
  deleteChat(chatId: string): Promise<void> {
    const chatRef = doc(this.firestore, 'chats', chatId); // Reference to the Firestore chat document
    return deleteDoc(chatRef); // Delete the chat document from Firestore
  }

  deleteEmptyChat(url: string) {
    const segments = url.split('/');
    const chatId = segments[3];
    const parts = chatId.split('_');
    if (parts[0] === parts[1]) {
      return;
    } else {
      this.emptyChat(chatId)
        .pipe(take(1))
        .subscribe((isEmpty) => {
          if (isEmpty) {
            this.deleteChat(chatId);
          }
        });
    }
  }

  emptyChat(chatId: string): Observable<boolean> {
    const path = `/chats/${chatId}/messages`;
    const ref = collection(this.firestore, path);
    const q = query(ref, limit(1));

    return collectionData(q).pipe(map((docs) => docs.length === 0));
  }

  /**
   * Navigates to a specific chat screen and sets the other user for the current session.
   *
   * This method first checks if the chat exists and creates a new one if necessary,
   * then navigates to the chat and sets the mobile dashboard state.
   *
   * @param currentUserId - The ID of the current user.
   * @param otherUser - The user object of the other participant in the chat.
   */
  async navigateToChat(currentUserId: string, otherUser: UserInterface) {
    const chatId = await this.getChatId(currentUserId, otherUser.uid); // Get the unique chat ID
    await this.createChat(currentUserId, otherUser.uid); // Create the chat if it doesn't exist
    this.setOtherUser(otherUser); // Set the other user in the service
    this.screenService.setDashboardState('message-window'); // Update the mobile dashboard state
    this.router.navigate(['/dashboard', 'chat', chatId]); // Navigate to the chat screen
  }

  /**
   * Sets the other user for the current chat session.
   *
   * @param user - The user object of the other participant in the chat.
   */
  setOtherUser(user: UserInterface) {
    this._otherUser$.next(user); // Update the BehaviorSubject with the new other user
  }

  // unsubscribeAll() {
  //   this.chatSubscriptions.forEach((sub) => sub.unsubscribe());
  //   this.chatSubscriptions = [];
  //   this.chatsCache.clear(); // Cache auch leeren
  //   this._otherUser$.next(null);
  // }
}
