import { ElementRef, Injectable } from '@angular/core';
import {
  collection,
  doc,
  docData,
  Firestore,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import {
  Observable,
  of,
  shareReplay,
  Subject,
} from 'rxjs';
import { PostInterface } from '../shared/models/post.interface';
import { MobileService } from './mobile.service';
import { Router } from '@angular/router';
import { EMOJIS } from '../shared/constants/emojis';

@Injectable({
  providedIn: 'root', // Service is available globally in the application
})
export class PostService {
  emojis = EMOJIS;
  private postCache = new Map<string, Observable<PostInterface>>();

  constructor(
    private firestore: Firestore,
    private mobileService: MobileService,
    private router: Router
  ) {}

  // Holds the current list of messages for the displayed conversation
  // private _messagesDisplayedConversation = new BehaviorSubject<
  //   PostInterface[]
  // >([]);
  // Public observable for components to subscribe to
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
    // Reference to the subcollection
    const postsRef = collection(
      this.firestore,
      `${parentPath}/${subcollectionName}`
    );

    // Create a new document reference with an auto-generated ID
    const newDocRef = doc(postsRef); // Firestore generates the ID automatically

    // Write the document including the ID and server timestamp
    await setDoc(newDocRef, {
      ...post,
      id: newDocRef.id, // Save the document ID in the document
      createdAt: serverTimestamp(),
      hasReactions: false,
    });

    return newDocRef.id; // Return the ID of the created document (optional)
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
   * Updates the data of a post in Firestore with the given information.
   *
   * @param data - The data that should be updated.
   * @param conversationType - Type of conversation ('channel' or 'chat').
   * @param conversationId - ID of the conversation.
   * @param messageId - ID of the post.
   * @param answerId - Optional ID of the answer if updating a reply.
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
   * Compares the date a post was created with today's date.
   * Returns true if the post was created today, false otherwise.
   *
   * @param postDate - The creation date of the post.
   * @returns A boolean indicating whether the post was created today.
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

  /**
   * Selects a post to be highlighted or interacted with.
   *
   * @param postId - The ID of the post to select.
   */
  select(postId: string) {
    if (!postId) return;
    this._select$.next(postId);
  }

  /**
   * This function navigates to the thread-window with the answers to the selected post.
   *
   * @param postId The ID of the post.
   * @param conversationType The type of the conversation ('channel' or 'chat').
   * @param conversationId The ID of the conversation.
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
   * This function transforms the post input value in HTML to text for saving it in Firebase.
   * Line breaks and emojis are preserved during the transformation.
   *
   * @param postInput The content of the input field (as HTML).
   * @returns The text representation of the post (suitable for saving in Firebase).
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
    doc.querySelectorAll('.mark').forEach((mark) => {
      const img = mark.querySelector('img');
      const span = mark.querySelector('span');
      if (img && span) {
        const name = span.textContent;
        const alt = img.getAttribute('alt');
        const typeOfResult = alt?.includes('user') ? '@' : '#';
        const textNode = doc.createTextNode(`{${typeOfResult}${name}}`);
        mark.replaceWith(textNode);
      }
    });
    const postText = doc.body.innerText;
    return postText;
  }

  /**
   * This function transforms the text saved in Firebase back into HTML.
   * Line breaks and emojis are correctly represented.
   *
   * @param text The post's text as saved in Firebase.
   * @returns The HTML representation of the text (with line breaks and emojis).
   */
  textToHtml(text: string): string {
    if (!text) return '';
    let result = text.replaceAll('\n', '</div><div>');
    this.emojis.forEach((e) => {
      const imgTag = `&nbsp;<img src="${e.src}" alt="${e.token}" class="emoji">&nbsp;`;
      result = result.replaceAll(e.token, imgTag);
    });
    result = result.replace(/\{@([^}]+)\}/g, (_, name: string) => {
      return `<mark class="mark flex" contenteditable="false">
                <img src="/assets/img/alternate-email-purple.svg" alt="mark">
                <span>${name}</span>
              </mark>`;
    });
    result = result.replace(/\{#([^}]+)\}/g, (_, name: string) => {
      return `<mark class="mark flex" contenteditable="false">
                <img src="/assets/img/tag-blue.svg" alt="mark">
                <span>${name}</span>
              </mark>`;
    });
    return result;
  }

  /**
   * This function sets the cursor to the end of an editable div.
   *
   * @param element - the editable to focus on.
   */
  focusAtEndEditable(element: ElementRef | null) {
    if (element) {
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

  /**
   * Fetch a single user by UID.
   * @param uid - User ID.
   * Returns an Observable of UserInterface.
   */
  getPostById(
    conversationType: 'channel' | 'chat',
    conversationId: string,
    messageId: string
  ): Observable<PostInterface> {
    if (!this.postCache.has(messageId)) {
      const ref = doc(
        this.firestore,
        `${conversationType}s/${conversationId}/messages/${messageId}`
      );
      const post$ = docData(ref).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this.postCache.set(messageId, post$ as Observable<PostInterface>);
    }
    return this.postCache.get(messageId)!;
  }
}
