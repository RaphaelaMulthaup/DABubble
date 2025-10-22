import { ElementRef, Injectable } from '@angular/core';
import {
  collection,
  CollectionReference,
  doc,
  docData,
  Firestore,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable, of, shareReplay, Subject } from 'rxjs';
import { PostInterface } from '../shared/models/post.interface';
import { Router } from '@angular/router';
import { EMOJIS } from '../shared/constants/emojis';
import { ScreenService } from './screen.service';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private emojis = EMOJIS;
  private postCache = new Map<string, Observable<PostInterface>>();
  private _select$ = new Subject<string>();
  public selected$ = this._select$.asObservable();

  constructor(
    private firestore: Firestore,
    private router: Router,
    public screenService: ScreenService
  ) {}

  /**
   * Sends a post to a given subcollection (e.g. messages of a conversation or thread).
   *
   * @param parentPath - Path to the parent document (e.g. "chats/{chatId}").
   * @param subcollectionName - Name of the subcollection (e.g. "messages").
   * @param post - post object without `createdAt` (timestamp is added automatically).
   */
  async sendPost(
    parentPath: string,
    subcollectionName: string,
    post: Omit<PostInterface, 'createdAt' | 'id'>
  ) {
    const postsRef = collection(
      this.firestore,
      `${parentPath}/${subcollectionName}`
    );
    await this.createPost(postsRef, post);
  }

  /**
   * Create a new document reference and write the document including the ID and server timestamp.
   * It returns the created posts id.
   *
   * @param postsRef - reference to the subcollection where the post should be saved
   * @param post - post object (message or answer) without `createdAt` (timestamp is added automatically).
   */
  async createPost(
    postsRef: CollectionReference,
    post: Omit<PostInterface, 'createdAt' | 'id'>
  ): Promise<string> {
    const newDocRef = doc(postsRef);
    await setDoc(newDocRef, {
      ...post,
      id: newDocRef.id,
      createdAt: serverTimestamp(),
      hasReactions: false,
    });
    return newDocRef.id;
  }

  /**
   * Creates a new message inside a conversation.
   *
   * @param conversationId - ID of the conversation (chat or channel).
   * @param senderId - User ID of the sender.
   * @param text - Text content of the message.
   * @param conversationType - Type of conversation ("chat" or "channel").
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
    return of ([]);
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
   * @param postId - The ID of the post.
   * @param conversationType - The type of the conversation ('channel' or 'chat').
   * @param conversationId - The ID of the conversation.
   */
  openAnswers( postId: string, conversationType: 'channel' | 'chat', conversationId: string) {
    this.screenService.setDashboardState('thread-window');
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
   * Line breaks, emojis and marks are preserved during the transformation.
   * The result is a text suitable for saving in Firebase
   *
   * @param postInput - The content of the input field (as HTML).
   */
  htmlToText(postInput: string): string {
    const postHtml = postInput
      .replaceAll('<div>', '\n')
      .replaceAll('</div>', '');
    const parser = new DOMParser();
    const doc = parser.parseFromString(postHtml, 'text/html');
    this.replaceEmojis(doc);
    this.replaceMarks(doc);
    const postText = doc.body.innerText;
    return postText;
  }

  /**
   * This function replaces all images with class 'emoji' with the corresponding token.
   *
   * @param doc - the DOM-document created from the html-string.
   */
  replaceEmojis(doc: Document) {
    doc.querySelectorAll('img.emoji').forEach((img) => {
      const src = img.getAttribute('src');
      const emoji = this.emojis.find((e) => e.src === src);
      if (emoji) {
        const textNode = doc.createTextNode(emoji.token);
        img.replaceWith(textNode);
      }
    });
  }

  /**
   * This function replaces all marks with a token including the type of result (channel or user) and the marked name.
   *
   * @param doc - the DOM-document created from the html-string.
   */
  replaceMarks(doc: Document) {
    doc.querySelectorAll('.mark').forEach((mark) => {
      const img = mark.querySelector('img');
      const span = mark.querySelector('span');
      if (img && span) {
        const name = span.textContent;
        const typeOfResult = img.getAttribute('src')?.includes('email') ? '@' : '#';
        const textNode = doc.createTextNode(`{${typeOfResult}${name}}`);
        mark.replaceWith(textNode);
      }
    });
  }

  /**
   * This function transforms the text saved in Firebase back into HTML.
   * Line breaks, emojis and marks are correctly represented.
   *
   * @param text - The post's text as saved in Firebase.
   */
  textToHtml(text: string): string {
    if (!text) return '';
    let result = text.replaceAll('\n', '</div><div>');
    result = this.replaceEmojiTokens(result);
    result = this.replaceMarkTokens(result);
    return result;
  }

  /**
   * This function replaces all emoji-tokens with an image of that emoji.
   *
   * @param result - the result of the transformed text
   */
  replaceEmojiTokens(result: string) {
    this.emojis.forEach((e) => {
      const imgTag = `&nbsp;<img src="${e.src}" alt="${e.token}" class="emoji">&nbsp;`;
      result = result.replaceAll(e.token, imgTag);
    });
    return result;
  }

  /**
   * This function replaces all mark-tokens with an html-mark including the type of result (channel or user) and the marked name.
   *
   * @param result - the result of the transformed text
   */
  replaceMarkTokens(result: string) {
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
   * @param element - the editable to focus on
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
   * Fetches a single post by its ID and returns an PostInterface-Observable.
   *
   * @param conversationType - whether the post is part of a channel or chat.
   * @param conversationId - the ID of the conversation
   * @param postId - the ID of the post itself
   */
  getPostById(
    conversationType: 'channel' | 'chat',
    conversationId: string,
    postId: string
  ): Observable<PostInterface> {
    if (!this.postCache.has(postId)) {
      const ref = doc(
        this.firestore,
        `${conversationType}s/${conversationId}/messages/${postId}`
      );
      const post$ = docData(ref).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this.postCache.set(postId, post$ as Observable<PostInterface>);
    }
    return this.postCache.get(postId)!;
  }
}
