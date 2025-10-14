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
  private basePathMap: Record<string, string> = {
    channel: 'channels',
    chat: 'chats',
  };

  currentConversation = signal<string | null>(null);
  limit$ = new BehaviorSubject<number>(5);

   private limits = new Map<string, BehaviorSubject<number>>();
  allMessagesLoaded = new Map<string, boolean>();
  constructor(private firestore: Firestore) {}

  // Observable for Id
  getConversationId$(route: ActivatedRoute): Observable<string> {
    return route.paramMap.pipe(map((params) => params.get('conversationId')!));
  }

  // Observable for Type
  getConversationType$(route: ActivatedRoute): Observable<string> {
    return route.paramMap.pipe(
      map((params) => params.get('conversationType')!)
    );
  }

  // Observable for type ???
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

    private getLimit$(conversationId: string) {
    if (!this.limits.has(conversationId)) {
      this.limits.set(conversationId, new BehaviorSubject<number>(5));
    }
    return this.limits.get(conversationId)!;
  }

    resetConversation(conversationId: string) {
    this.allMessagesLoaded.delete(conversationId);
    if (this.limits.has(conversationId)) {
      this.limits.get(conversationId)!.next(5);
    }
  }



  getMessages(conversationType: string, conversationId: string) {
    const basePath = this.basePathMap[conversationType];
    if (!basePath) return of([]);

    return this.getLimit$(conversationId).pipe(
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
              this.allMessagesLoaded.set(conversationId, true);
            }
            return docs;
          })
        ) as Observable<PostInterface[]>;
      })
    );
  }

//   resetConversation(conversationId: string) {
//   this.limit$.next(5);
//   this.allMessagesLoaded.delete(conversationId);
// }

  loadMore(conversationId: string) {
    if (this.allMessagesLoaded.get(conversationId)) return;
    this.getLimit$(conversationId).next(this.getLimit$(conversationId).value + 5);
  }

  // loadMore(conversationId: string) {
  //   if (this.allMessagesLoaded.get(conversationId)) return;
  //   this.limit$.next(this.limit$.value + 5);
  //   console.log(this.limit$.value);
  // }

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
