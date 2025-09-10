import { ElementRef, inject, Injectable } from '@angular/core';
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
import { EMOJIS } from '../shared/constants/emojis';

@Injectable({
  providedIn: 'root', // Service is available globally in the application
})
export class PostService {
  emojis = EMOJIS;

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private mobileService: MobileService,
    private router: Router
  ) {}

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
   * @param emojiToken - the token of the chosen emoji
   * @returns A Promise that resolves once the reaction update has been applied.
   */
  async toggleReaction(
    parentPath: string,
    subcollectionName: string,
    postId: string,
    emoji: { token: string; src: string }
  ) {
    let userId = this.authService.currentUser.uid;
    const reactionRef = doc(
      this.firestore,
      `${parentPath}/${subcollectionName}/${postId}/reactions/${emoji.token}`
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

  // /**
  //  * This functions uses the emoji to convert it to a proper reaction-id.
  //  *
  //  * @param emoji - the image-path for the chosen emoji.
  //  * @returns an adjusted string (the name of the emoji with '_' instead of '-')
  //  */
  // getReactionId(emoji: string): string {
  //   return emoji.substring(18, emoji.length - 4).replace(/-/g, '_');
  // }

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
   * Creates a new message inside a conversation.
   *
   * @param conversationId - ID of the conversation (chat or channel).
   * @param senderId - User ID of the sender.
   * @param text - Text content of the message.
   * @param conversationType - Type of conversation ("chat" or "channel").
   * @returns An observable placeholder (currently resolves to an empty array).
   */
  async createMessage(
    conversationId: string,
    senderId: string,
    text: string,
    conversationType: string
  ) {
    await this.sendPost(`${conversationType}s/${conversationId}`, 'messages', {
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
   * @param conversationType - Type of conversation (currently only supports "channel").
   * @returns A Promise with the created answer document reference, or an empty observable if not in a channel.
   */
  async createAnswer(
    conversationId: string,
    messageId: string,
    senderId: string,
    text: string,
    conversationType: string
  ) {
    await this.sendPost(
      `${conversationType}s/${conversationId}/messages/${messageId}`,
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
      conversationType as 'channel' | 'chat',
      conversationId,
      messageId
    );
    return of([]);
  }

  /**
   * This function updates the data of a post in firebase with the given information.
   *
   * @param data - the data that should be updated
   * @param conversationType - Type of conversation ('channel' or 'chat')
   * @param conversationId - ID of the conversation
   * @param messageId - ID of the post
   * @param postId - ID of the post
   */
  async updatePost(
    data: any = {},
    conversationType: 'channel' | 'chat',
    conversationId: string,
    messageId: string,
    answerId?: string
  ) {
    let ref;
    if (answerId) {
      ref = doc(
        this.firestore,
        `${conversationType}s/${conversationId}/messages/${messageId}/answers/${answerId}`
      );
    } else {
      ref = doc(
        this.firestore,
        `${conversationType}s/${conversationId}/messages/${messageId}`
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
   * @param conversationType conversation-type (channel or chat)
   * @param conversationId the id of the conversation
   */
  openAnswers(
    postId: string,
    conversationType: 'channel' | 'chat',
    conversationId: string
  ) {
    this.mobileService.setMobileDashboardState('thread-window');
    this.router.navigate([
      '/dashboard',
      conversationType,
      conversationId,
      'answers',
      postId,
    ]);
  }

  /**
   * This function transforms the posts input value in text for saving it in firebase.
   * Thereby, linebreaks and emojis are preserved.
   *
   * @param postInput the content of the input-field (as html)
   */
  htmlToText(postInput: string): string {
    const postHtml = postInput
      .replaceAll('<div>', '\n')
      .replaceAll('</div>', '');
    const parser = new DOMParser();
    const doc = parser.parseFromString(postHtml, 'text/html');

    doc.querySelectorAll('img.emoji').forEach((img) => {
      const src = img.getAttribute('src');
      const emoji = this.emojis.find((e) => e.src === src);

      if (emoji) {
        const textNode = doc.createTextNode(emoji.token);
        img.replaceWith(textNode);
      }
    });
    const postText = doc.body.innerText;
    return postText;
  }

  /**
   * This function transforms the text saved in firebase to html.
   * Thereby, linebreaks and emojis are correctly shown.
   *
   * @param text the posts text as saved in firebase.
   */
  textToHtml(text: string): string {
    if (!text) return '';
    let result = text.replaceAll('\n', '<br>');
    this.emojis.forEach((e) => {
      const imgTag = `<img src="${e.src}" alt="${e.token}" class="emoji">`;
      result = result.replaceAll(e.token, imgTag);
    });
    return result;
  }

  focusAtEndEditable(element: ElementRef) {
    element.nativeElement.focus();
    const range = document.createRange();
    range.selectNodeContents(element.nativeElement);
    range.collapse(false);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}
