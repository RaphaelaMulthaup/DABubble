import { Injectable } from '@angular/core';
import {
  collection,
  collectionSnapshots,
  deleteDoc,
  doc,
  Firestore,
  setDoc,
} from '@angular/fire/firestore';
import { ChatInterface } from '../shared/models/chat.interface'; // Interface for chat data
import {
  BehaviorSubject,
  distinctUntilChanged,
  map,
  Observable,
  shareReplay,
} from 'rxjs';
import { Router } from '@angular/router'; // Router to navigate within the app
import { MobileService } from './mobile.service'; // Service for handling mobile dashboard state
import { UserInterface } from '../shared/models/user.interface'; // Interface for user data

@Injectable({
  providedIn: 'root', // The service is provided in the root module
})
export class ChatService {
  /**
   * Private BehaviorSubject to hold the current other user in the chat.
   * It is exposed as an observable for other components to subscribe to.
   */
  private _otherUser$ = new BehaviorSubject<UserInterface | null>(null);
  private chatsCache = new Map<string, Observable<ChatInterface[]>>();
  otherUser$ = this._otherUser$.asObservable(); // Public observable for other user

  constructor(
    private router: Router, // Inject Router to handle navigation
    private firestore: Firestore, // Inject Firestore for database interaction
    private mobileService: MobileService // Inject MobileService to manage mobile dashboard state
  ) {}

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
      const chatsRef = collection(this.firestore, 'chats'); // Reference to the "chats" collection in Firestore

      const chats$ = collectionSnapshots(chatsRef).pipe(
        map((snaps) =>
          snaps
            // Keep only chats whose ID contains the userId
            .filter((snap) => snap.id.includes(userId))
            .map((snap) => {
              const data = snap.data() as Omit<ChatInterface, 'id'>; // Extract the data, excluding the 'id' field
              const id = snap.id; // Document ID consisting of both user IDs
              return { id, ...data }; // Return the full chat data with the ID
            })
        ),
        distinctUntilChanged(
          (a, b) =>
            a.length === b.length && a.every((chat, i) => chat.id === b[i].id)
        ),
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this.chatsCache.set(userId, chats$);
    }
    return this.chatsCache.get(userId)!;
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
    return userA === currentUserId ? userB : userA; // Return the other user's ID
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
    this.mobileService.setMobileDashboardState('message-window'); // Update the mobile dashboard state
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
}
