import { Injectable, signal, WritableSignal } from '@angular/core';
import {
  DocumentData,
  Firestore,
  QueryDocumentSnapshot,
  collection,
  collectionData,
  doc,
  docData,
  getDocs,
  limit,
  limitToLast,
  or,
  orderBy,
  query,
  startAfter,
} from '@angular/fire/firestore';
import {
  Observable,
  of,
  map,
  shareReplay,
  catchError,
  from,
  combineLatest,
  BehaviorSubject,
  last,
  filter,
  switchMap,
} from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { PostInterface } from '../shared/models/post.interface';
import { ChannelInterface } from '../shared/models/channel.interface';
import { DashboardState } from '../shared/types/dashboard-state.type';

@Injectable({
  providedIn: 'root',
})
export class ConversationActiveRouterService {
  private basePathMap: Record<string, string> = {
    channel: 'channels',
    chat: 'chats',
  };

  currentConversation = signal<string | null>(null);
  private limit$ = new BehaviorSubject<number>(5);
  private allMessagesLoaded = false;

  constructor(private firestore: Firestore) {}

  // expui un observable pentru id
  getConversationId$(route: ActivatedRoute): Observable<string> {
    return route.paramMap.pipe(map((params) => params.get('conversationId')!));
  }

  // expui un observable pentru type
  getConversationType$(route: ActivatedRoute): Observable<string> {
    return route.paramMap.pipe(
      map((params) => params.get('conversationType')!)
    );
  }

  // expui un observable pentru type
  getMessageId$(route: ActivatedRoute): Observable<string> {
    return route.paramMap.pipe(map((params) => params.get('messageId')!));
  }

  getParams$(
    route: ActivatedRoute
  ): Observable<{ conversationType: string; conversationId: string }> {
    return route.paramMap.pipe(
      map((params) => ({
        conversationType: params.get('conversationType')!,
        conversationId: params.get('conversationId')!,
      }))
    );
  }

  getMessages(conversationType: string, conversationId: string) {
    if (this.allMessagesLoaded) return of([]);
    const basePath = this.basePathMap[conversationType];
    if (!basePath) return of([]);

    return this.limit$.pipe(
      switchMap((limitValue) => {
        const path = `${basePath}/${conversationId}/messages`;
        const ref = collection(this.firestore, path);
        const q = query(
          ref,
          orderBy('createdAt', 'asc'),
          limitToLast(limitValue)
        );
        return collectionData(q, { idField: 'id' }).pipe(
          map((docs) => {
            if (docs.length < limitValue) {
              this.allMessagesLoaded = true;
            }
            return docs;
          })
        ) as Observable<PostInterface[]>;
      })
    );
  }

  loadMore() {
    if (this.allMessagesLoaded) return;
    this.limit$.next(this.limit$.value + 5);
  }

  getAnswers(
    conversationType: string,
    conversationId: string,
    messageId: string
  ): Observable<PostInterface[]> {
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
