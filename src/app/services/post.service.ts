import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { PostInterface } from '../shared/models/post.interface';
import { ReactionInterface } from '../shared/models/reaction.interface';
import { ChatInterface } from '../shared/models/chat.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root', // Service is available globally in the application
})
export class PostService {
  // Inject Firestore instance
  private firestore: Firestore = inject(Firestore);
  private authService = inject(AuthService);

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
    let userId = this.authService.getCurrentUserId()!;
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
    const reactionsRef = collection(
      this.firestore,
      `${parentPath}/${subcollectionName}/${messageId}/answers`
    );
    return collectionData(reactionsRef, { idField: 'id' }) as Observable<
      PostInterface[]
    >;
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
    type: 'channel' | 'chat'
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
   * @param conversationId - ID of the channel.
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
    type: 'channel' | 'chat'
  ) {
    await this.sendPost(
      `${type}s/${conversationId}/messages/${messageId}`,
      'answers',
      {
        senderId: senderId,
        text,
      }
    );
    return of([]);
  }

  /**
   * This function compares the date, a post was created with today.
   * It returns true or false, depending on those are the same or not.
   *
   * @param index the index of the post
   */
  isPostCreatedToday(post: PostInterface): boolean {
    let postDate = post.createdAt.toDate().setHours(0, 0, 0, 0);
    let today = new Date().setHours(0, 0, 0, 0);
    return postDate == today;
  }

  private _select$ = new Subject<string>();
  selected$ = this._select$.asObservable();

  select(postId: string) {
    if (!postId) return;
    this._select$.next(postId);
  }
}
