import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  orderBy,
  query,
} from '@angular/fire/firestore';
import { Observable, of, map } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { PostInterface } from '../shared/models/post.interface';

@Injectable({
  providedIn: 'root',
})
export class ChatActiveRouterService {
  constructor(private firestore: Firestore) {}

  // expui un observable pentru id
  getConversationId$(route: ActivatedRoute): Observable<string> {
    return route.paramMap.pipe(map((params) => params.get('conversationId')!));
  }

  // expui un observable pentru type
  getConversationType$(route: ActivatedRoute): Observable<string> {
    return route.paramMap.pipe(map((params) => params.get('conversationType')!));
  }

  // expui un observable pentru type
  getMessageId$(route: ActivatedRoute): Observable<string> {
    return route.paramMap.pipe(map((params) => params.get('messageId')!));
  }

  getParams$(route: ActivatedRoute): Observable<{ conversationType: string; conversationId: string }> {
    return route.paramMap.pipe(
      map((params) => ({
        conversationType: params.get('conversationType')!,
        conversationId: params.get('conversationId')!
      }))
    );
  }

  getMessages(conversationType: string, conversationId: string): Observable<PostInterface[]> {
    // den Pfad dynamisch je nach type bauen
    let path: string | null = null;

    if (conversationType === 'channel') {
      path = `channels/${conversationId}/messages`;
    } else if (conversationType === 'chat') {
      path = `chats/${conversationId}/messages`;
    }

    if (!path) {
      return of([]); // fallback, falls type nicht passt
    }

    const ref = collection(this.firestore, path);
    const q = query(ref, orderBy('createdAt', 'asc')); // immer sortieren

    return collectionData(q, { idField: 'id' }).pipe(
      map((docs) =>
        docs.map(
          (doc) =>
            ({
              ...doc,
              channelId: conversationType === 'channel' ? conversationId : undefined,
              chatId: conversationType === 'chat' ? conversationId : undefined,
            } as PostInterface)
        )
      )
    );
  }

  getAnswers(
    conversationType: string,
    conversationId: string,
    messageId: string
  ): Observable<PostInterface[]> {
    let ref;
    let q;
    if (conversationType === 'channel') {
      ref = collection(
        this.firestore,
        `channels/${conversationId}/messages/${messageId}/answers`
      );
      q = query(ref, orderBy('createdAt', 'asc'));
      return collectionData(q, { idField: 'id' }) as Observable<
        PostInterface[]
      >;
    } else if (conversationType === 'chat') {
      ref = collection(
        this.firestore,
        `chats/${conversationId}/messages/${messageId}/answers`
      );
      q = query(ref, orderBy('createdAt', 'asc'));
      return collectionData(q, { idField: 'id' }) as Observable<
        PostInterface[]
      >;
    }
    return of([]);
  }

  getChannelInfo(conversationType: string, conversationId: string): Observable<any> {
    if (conversationType === 'channel') {
      const channelRef = doc(this.firestore, `channels/${conversationId}`);
      return docData(channelRef);
    }
    return of([]);
  }
}
