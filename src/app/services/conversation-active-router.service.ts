import { Injectable, signal } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  limitToLast,
  orderBy,
  query,
} from '@angular/fire/firestore';
import {
  Observable,
  of,
  map,
  shareReplay,
  catchError,
  BehaviorSubject,
  switchMap,
} from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { PostInterface } from '../shared/models/post.interface';

@Injectable({
  providedIn: 'root',
})
export class ConversationActiveRouterService {
  limit$ = new BehaviorSubject<number>(5);
  limits = new Map<string, BehaviorSubject<number>>();
  allMessagesLoaded = new Map<string, boolean>();
  currentConversation = signal<string | null>(null);
  basePathMap: Record<string, string> = {
    channel: 'channels',
    chat: 'chats',
  };

  constructor(private firestore: Firestore) {}

  /**
   * Returns an observable of the conversation ID from the route.
   */
  getConversationId$(route: ActivatedRoute): Observable<string> {
    return route.paramMap.pipe(map((params) => params.get('conversationId')!));
  }

  /**
   * Returns an observable of the conversation type from the route.
   */
  getConversationType$(route: ActivatedRoute): Observable<'chat' | 'channel'> {
    return route.paramMap.pipe(map((params) => params.get('conversationType')! as 'chat' | 'channel'));
  }

  /**
   * Returns an observable of the message ID from the route.
   */
  getMessageId$(route: ActivatedRoute): Observable<string> {
    return route.paramMap.pipe(map((params) => params.get('messageId')!));
  }

  /**
   * Returns an observable containing both conversation type and ID from the route.
   */
  getParams$(route: ActivatedRoute): Observable<{ conversationType: 'chat' | 'channel'; conversationId: string }> {
    return route.paramMap.pipe(
      map((params) => ({
        conversationType: params.get('conversationType')! as 'chat' | 'channel',
        conversationId: params.get('conversationId')!,
      }))
    );
  }

  /**
   * Returns a BehaviorSubject for the limit of messages to load for a conversation.
   */
  getLimit$(conversationId: string): BehaviorSubject<number> {
    if (!this.limits.has(conversationId)) this.limits.set(conversationId, new BehaviorSubject<number>(5));
    return this.limits.get(conversationId)!;
  }

  /**
   * Resets the conversation's message loading state and limit.
   */
  resetConversation(conversationId: string) {
    this.allMessagesLoaded.delete(conversationId);
    if (this.limits.has(conversationId)) this.limits.get(conversationId)!.next(5);
  }

  /**
   * Returns an observable of messages for a conversation, respecting the current limit.
   *
   * @param conversationType - Type of the conversation ('chat' | 'channel').
   * @param conversationId - ID of the conversation.
   */
  getMessages(conversationType: 'chat' | 'channel', conversationId: string): Observable<PostInterface[]> {
    const basePath = this.basePathMap[conversationType];
    if (!basePath) return of([]);
    return this.getLimit$(conversationId).pipe(
      switchMap((limitValue) => {
        return this.fetchMessagesFromFirestore(basePath, conversationId, limitValue);
      })
    );
  }

  /**
   * Loads messages from Firestore for a given conversation and limit.
   * Updates the allMessagesLoaded map if fewer messages are returned than requested.
   *
   * @param basePath - Base path for the conversation type in Firestore.
   * @param conversationId - ID of the conversation.
   * @param limitValue - Maximum number of messages to load.
   */
  fetchMessagesFromFirestore(basePath: string, conversationId: string, limitValue: number): Observable<PostInterface[]> {
    const path = `${basePath}/${conversationId}/messages`;
    const ref = collection(this.firestore, path);
    const q = query( ref, orderBy('createdAt', 'asc'), limitToLast(limitValue));
    return collectionData(q, { idField: 'id' }).pipe(
      map((docs) => {
        if (docs.length < limitValue) this.allMessagesLoaded.set(conversationId, true);
        return docs as PostInterface[];
      })
    );
  }

  /**
   * Increases the message loading limit for a conversation to load more messages.
   *
   * @param conversationId - ID of the conversation to load more messages for.
   */
  loadMore(conversationId: string) {
    if (this.allMessagesLoaded.get(conversationId)) return;
    this.getLimit$(conversationId).next(this.getLimit$(conversationId).value + 5);
  }

  /**
   * Returns an observable of answer messages for a specific message in a conversation.
   *
   * @param conversationType - Type of the conversation ('chat' | 'channel').
   * @param conversationId - ID of the conversation containing the message.
   * @param messageId - ID of the parent message to get answers for.
   */
  getAnswers( conversationType: string, conversationId: string, messageId: string): Observable<PostInterface[]> {
    const basePath = this.basePathMap[conversationType];
    if (!basePath) return of([]);
    const path = `${basePath}/${conversationId}/messages/${messageId}/answers`;
    const ref = collection(this.firestore, path);
    const q = query(ref, orderBy('createdAt', 'asc'));
    return collectionData(q, { idField: 'id' }).pipe(
      map((docs) => docs.map((doc) => ({ ...(doc as PostInterface) }))),
      shareReplay({ bufferSize: 1, refCount: true }),
      catchError(() => of([]))
    );
  }
}
