import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  orderBy,
  query,
} from '@angular/fire/firestore';
import { Observable, of, map, shareReplay, catchError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { PostInterface } from '../shared/models/post.interface';
import { ChannelInterface } from '../shared/models/channel.interface';

@Injectable({
  providedIn: 'root',
})
export class ConversationActiveRouterService {
  private readonly basePathMap: Record<string, string> = {
    channel: 'channels',
    chat: 'chats',
  };

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

  getMessages(
    conversationType: string,
    conversationId: string
  ): Observable<PostInterface[]> {
    const basePath = this.basePathMap[conversationType];
    if (!basePath) return of([]);

    const path = `${basePath}/${conversationId}/messages`;
    const ref = collection(this.firestore, path);
    const q = query(ref, orderBy('createdAt', 'asc'));

    return collectionData(q, { idField: 'id' }).pipe(
      map((docs) =>
        docs.map(
          (doc) =>
            ({
              ...doc,
              channelId:
                conversationType === 'channel' ? conversationId : undefined,
              chatId: conversationType === 'chat' ? conversationId : undefined,
            } as PostInterface)
        )
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
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

  getChannelInfo(
    conversationType: string,
    conversationId: string
  ): Observable<ChannelInterface | null> {
    if (conversationType !== 'channel') return of(null);
    const channelRef = doc(this.firestore, `channels/${conversationId}`);
    return docData(channelRef).pipe(
      map((data) => (data ? (data as ChannelInterface) : null)),
      shareReplay({ bufferSize: 1, refCount: true }),
      catchError(() => of(null))
    );
  }
}
