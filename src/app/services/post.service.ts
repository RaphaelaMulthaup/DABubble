import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  Firestore,
  getCountFromServer,
  getDoc,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { PostInterface } from '../shared/models/post.interface';
import { ReactionInterface } from '../shared/models/reaction.interface';
import { ChatInterface } from '../shared/models/chat.interface';
import { AuthService } from './auth.service';
import { MobileService } from './mobile.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root', // Service is available globally in the application
})
export class PostService {
  // Inject Firestore instance
  private firestore: Firestore = inject(Firestore);
  private authService = inject(AuthService);
  private mobileService = inject(MobileService);
  private router = inject(Router);

  // // Holds the current list of messages for the displayed conversation
  // private _messagesDisplayedConversation = new BehaviorSubject<
  //   PostInterface[]
  // >([]);
  // // Public observable for components to subscribe to
  // messagesDisplayedConversation$ =
  //   this._messagesDisplayedConversation.asObservable();

  /**
   * Sends a post to a given subcollection (e.g. messages of a conversation or thread).
   * Automatically sets the `createdAt` field to the server timestamp.
   *
   * @param parentPath - Path to the parent document (e.g. "chats/{chatId}").
   * @param subcollectionName - Name of the subcollection (e.g. "messages").
   * @param post - post object without `createdAt` (timestamp is added automatically).
   * @returns A Promise that resolves once the message has been written.
   */
  async sendPost(
    parentPath: string,
    subcollectionName: string,
    post: Omit<PostInterface, 'createdAt' | 'id'>
  ) {
    // Referenz auf die Collection
    const postsRef = collection(
      this.firestore,
      `${parentPath}/${subcollectionName}`
    );

    // Erstelle ein neues DocumentRef mit automatisch generierter ID
    const newDocRef = doc(postsRef); // ohne ID -> Firestore generiert eine

    // Dokument schreiben inkl. der ID
    await setDoc(newDocRef, {
      ...post,
      id: newDocRef.id, // ID direkt im Dokument speichern
      createdAt: serverTimestamp(),
    });

    return newDocRef.id; // optional: zurückgeben
  }
  // async sendPost(
  //   parentPath: string,
  //   subcollectionName: string,
  //   post: Omit<PostInterface, 'createdAt'>
  // ) {
  //   const postsRef = collection(
  //     this.firestore,
  //     `${parentPath}/${subcollectionName}`
  //   );
  //   await addDoc(postsRef, {
  //     ...post,
  //     createdAt: serverTimestamp(), // Firestore server timestamp
  //   });
  // }

  /**
   * Toggles a reaction for a given post.
   *
   * - If the user has already reacted with the emoji, their ID will be removed.
   * - Otherwise, their ID will be added.
   * - If the emoji does not exist yet, a new reaction document is created.
   *
   * @param parentPath - Path to the parent document (e.g. "chats/{chatId}").
   * @param subcollectionName - Name of the subcollection (e.g. "messages").
   * @param postId - ID of the post being reacted to.
   * @param emoji - the image-path for the chosen emoji.
   * @returns A Promise that resolves once the reaction update has been applied.
   */
  async toggleReaction(
    parentPath: string,
    subcollectionName: string,
    postId: string,
    emoji: string
  ) {
    let userId = this.authService.currentUser.uid;
    let reactionId = this.getReactionId(emoji);
    const reactionRef = doc(
      this.firestore,
      `${parentPath}/${subcollectionName}/${postId}/reactions/${reactionId}`
    );

    const reactionSnap = await getDoc(reactionRef);

    if (reactionSnap.exists()) {
      const data = reactionSnap.data();
      const users: string[] = data['users'] || [];

      if (users.includes(userId)) {
        // User already reacted → remove their reaction
        await updateDoc(reactionRef, {
          users: arrayRemove(userId),
          //maybe add to delete doc in firestore, if there are no users with this reactin left?
        });
      } else {
        // User has not reacted → add their reaction
        await updateDoc(reactionRef, {
          users: arrayUnion(userId),
        });
      }
    } else {
      // First reaction with this emoji → create document
      await setDoc(reactionRef, {
        emoji,
        users: [userId],
      });
    }
  }

  /**
   * This functions uses the emoji to convert it to a proper reaction-id.
   *
   * @param emoji - the image-path for the chosen emoji.
   * @returns an adjusted string (the name of the emoji with '_' instead of '-')
   */
  getReactionId(emoji: string): string {
    return emoji.substring(18, emoji.length - 4).replace(/-/g, '_');
  }

  /**
   * Fetches all reactions of a post in real time.
   *
   * @param parentPath - Path to the parent document (e.g. "chats/{chatId}").
   * @param subcollectionName - Name of the subcollection (e.g. "messages").
   * @param postId - ID of the post whose reactions should be fetched.
   * @returns Observable that emits the list of reactions (with emoji name and user IDs).
   */
  getReactions(
    parentPath: string,
    subcollectionName: string,
    postId: string
  ): Observable<ReactionInterface[]> {
    const reactionsRef = collection(
      this.firestore,
      `${parentPath}/${subcollectionName}/${postId}/reactions`
    );
    return collectionData(reactionsRef, { idField: 'id' }) as Observable<
      ReactionInterface[]
    >;
  }

  /**
   * Fetches all answers of a message in real time.
   *
   * @param parentPath - Path to the parent document (e.g. "chats/{chatId}").
   * @param subcollectionName - Name of the subcollection (e.g. "messages").
   * @param messageId - ID of the message whose reactions should be fetched.
   * @returns Observable that emits the list of reactions (with emoji name and user IDs).
   */
  getAnswers(
    parentPath: string,
    subcollectionName: string,
    messageId: string
  ): Observable<PostInterface[]> {
    const ref = collection(
      this.firestore,
      `${parentPath}/${subcollectionName}/${messageId}/answers`
    );
    const q = query(ref, orderBy('createdAt', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<PostInterface[]>;
  }

  /**
   * Creates a new message inside a conversation.
   *
   * @param conversationId - ID of the conversation (chat or channel).
   * @param senderId - User ID of the sender.
   * @param text - Text content of the message.
   * @param type - Type of conversation ("chat" or "channel").
   * @returns An observable placeholder (currently resolves to an empty array).
   */
  async createMessage(
    conversationId: string,
    senderId: string,
    text: string,
    type: string
  ) {
    await this.sendPost(`${type}s/${conversationId}`, 'messages', {
      senderId: senderId,
      text,
    });
    return of([]);
  }

  /**
   * Creates an answer (reply) to an existing message inside a channel thread.
   *
   * @param conversationId - ID of the conversation.
   * @param messageId - ID of the parent message being replied to.
   * @param senderId - ID of the replying user.
   * @param text - Text content of the reply.
   * @param type - Type of conversation (currently only supports "channel").
   * @returns A Promise with the created answer document reference, or an empty observable if not in a channel.
   */
  async createAnswer(
    conversationId: string,
    messageId: string,
    senderId: string,
    text: string,
    type: string
  ) {
    await this.sendPost(
      `${type}s/${conversationId}/messages/${messageId}`,
      'answers',
      {
        senderId: senderId,
        text,
      }
    );
    this.updatePost(
      {
        ansCounter: increment(1),
        ansLastCreatedAt: new Date(),
      },
      type as 'channel' | 'chat',
      conversationId,
      messageId
    );
    return of([]);
  }

  /**
   * This function updates the data of a post in firebase with the given information.
   *
   * @param data - the data that should be updated
   * @param type - Type of conversation ('channel' or 'chat')
   * @param conversationId - ID of the conversation
   * @param messageId - ID of the post
   * @param postId - ID of the post
   */
  async updatePost(
    data: any = {},
    type: 'channel' | 'chat',
    conversationId: string,
    messageId: string,
    answerId?: string
  ) {
    let ref;
    if (answerId) {
      ref = doc(
        this.firestore,
        `${type}s/${conversationId}/messages/${messageId}/answers/${answerId}`
      );
    } else {
      ref = doc(
        this.firestore,
        `${type}s/${conversationId}/messages/${messageId}`
      );
    }
    await updateDoc(ref, data);
  }

  /**
   * This function compares the date, a post was created with today.
   * It returns true or false, depending on those are the same or not.
   *
   * @param index the index of the post
   */
  isPostCreatedToday(postDate: any): boolean {
    if (postDate === null) {
      postDate = new Date().setHours(0, 0, 0, 0);
    } else {
      postDate = postDate.toDate().setHours(0, 0, 0, 0);
    }
    let today = new Date().setHours(0, 0, 0, 0);
    return postDate == today;
  }

  private _select$ = new Subject<string>();
  selected$ = this._select$.asObservable();

  select(postId: string) {
    if (!postId) return;
    this._select$.next(postId);
  }

  /**
   * This function navigates to the thread-window with the answers to the selected post
   *
   * @param postId the id of the post
   * @param type conversation-type (channel or chat)
   * @param conversationId the id of the conversation
   */
  openAnswers(
    postId: string,
    type: 'channel' | 'chat',
    conversationId: string
  ) {
    this.mobileService.setMobileDashboardState('thread-window');
    this.router.navigate([
      '/dashboard',
      type,
      conversationId,
      'answers',
      postId,
    ]);
  }
}
