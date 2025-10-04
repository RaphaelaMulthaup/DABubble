import { Injectable } from '@angular/core';
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
} from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { PostInterface } from '../shared/models/post.interface';
import { ChannelInterface } from '../shared/models/channel.interface';

@Injectable({
  providedIn: 'root',
})
export class ConversationActiveRouterService {
  private basePathMap: Record<string, string> = {
    channel: 'channels',
    chat: 'chats',
  };

  private pagedMessages$ = new BehaviorSubject<PostInterface[]>([]);
  private lastVisibleMap = new Map<
    string,
    QueryDocumentSnapshot<DocumentData>
  >();

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

  private getRecentMessages(
    conversationType: string,
    conversationId: string,
    pageSize: number
  ): Observable<PostInterface[]> {
    const basePath = this.basePathMap[conversationType];
    if (!basePath) return of([]);

    const path = `${basePath}/${conversationId}/messages`;
    const ref = collection(this.firestore, path);

    const q = query(ref, orderBy('createdAt', 'desc'), limit(pageSize));

    return collectionData(q, { idField: 'id' }).pipe(
      map((docs) =>
        docs
          .map(
            (doc) =>
              ({
                ...doc,
                channelId:
                  conversationType === 'channel' ? conversationId : undefined,
                chatId:
                  conversationType === 'chat' ? conversationId : undefined,
              } as PostInterface)
          )
          .reverse()
      )
    );
  }

  getMessages(
    conversationType: string,
    conversationId: string,
    pageSize: number
  ): Observable<PostInterface[]> {
    const recent$ = this.getRecentMessages(
      conversationType,
      conversationId,
      pageSize
    );

    return combineLatest([this.pagedMessages$, recent$]).pipe(
      map(([paged, recent]) => {
        const ids = new Set(paged.map((m) => m.id));
        const merged = [...paged, ...recent.filter((m) => !ids.has(m.id))];
        return merged.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? 0;
          const bTime = b.createdAt?.toMillis?.() ?? 0;
          return aTime - bTime;
        });
      })
    );
  }

  async loadNextPage(
    conversationType: string,
    conversationId: string,
    pageSize: number
  ): Promise<void> {
    const basePath = this.basePathMap[conversationType];
    if (!basePath) return;

    const path = `${basePath}/${conversationId}/messages`;
    const ref = collection(this.firestore, path);
    const lastVisible = this.lastVisibleMap.get(conversationId);
    let q = query(ref, orderBy('createdAt', 'asc'), limit(pageSize));
    console.log('Loading older messages for', conversationId);

    if (lastVisible) {
      q = query(
        ref,
        orderBy('createdAt', 'asc'),
        startAfter(lastVisible),
        limit(pageSize)
      );
    }
    const snapshot = await getDocs(q);
    if (snapshot.docs.length > 0) {
      this.lastVisibleMap.set(
        conversationId,
        snapshot.docs[snapshot.docs.length - 1]
      );
    }
    const newMessages = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as PostInterface)
    );

    this.pagedMessages$.next([...this.pagedMessages$.value, ...newMessages]);
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

  // getChannelInfo(
  //   conversationType: string,
  //   conversationId: string
  // ): Observable<ChannelInterface | null> {
  //   if (conversationType !== 'channel') return of(null);
  //   const channelRef = doc(this.firestore, `channels/${conversationId}`);
  //   return docData(channelRef).pipe(
  //     map((data) => (data ? (data as ChannelInterface) : null)),
  //     shareReplay({ bufferSize: 1, refCount: true }),
  //     catchError(() => of(null))
  //   );
  // }
}
