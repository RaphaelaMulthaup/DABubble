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
  // Inject Firestore instance
  private firestore = inject(Firestore);

  // expui un observable pentru id
  getId$(route: ActivatedRoute): Observable<string> {
    return route.paramMap.pipe(map((params) => params.get('id')!));
  }

  // expui un observable pentru type
  getType$(route: ActivatedRoute): Observable<string> {
    return route.paramMap.pipe(map((params) => params.get('type')!));
  }

  // expui un observable pentru type
  getMessageId$(route: ActivatedRoute): Observable<string> {
    return route.paramMap.pipe(map((params) => params.get('messageId')!));
  }

  getParams$(route: ActivatedRoute): Observable<{ type: string; id: string }> {
    return route.paramMap.pipe(
      map((params) => ({
        type: params.get('type')!,
        id: params.get('id')!,
      }))
    );
  }

  getMessages(type: string, id: string): Observable<PostInterface[]> {
    // den Pfad dynamisch je nach type bauen
    let path: string | null = null;

    if (type === 'channel') {
      path = `channels/${id}/messages`;
    } else if (type === 'chat') {
      path = `chats/${id}/messages`;
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
              channelId: type === 'channel' ? id : undefined,
              chatId: type === 'chat' ? id : undefined,
            } as PostInterface)
        )
      )
    );
  }

  getAnswers(
    type: string,
    id: string,
    messageId: string
  ): Observable<PostInterface[]> {
    if (type === 'channel') {
      const answersRef = collection(
        this.firestore,
        `channels/${id}/messages/${messageId}/answers`
      );
      return collectionData(answersRef, { idField: 'id' }) as Observable<
        PostInterface[]
      >;
    } else if (type === 'chat') {
      const answersRef = collection(
        this.firestore,
        `chats/${id}/messages/${messageId}/answers`
      );
      return collectionData(answersRef, { idField: 'id' }) as Observable<
        PostInterface[]
      >;
    }
    return of([]);
  }

  getMessageInfo(type: string, id: string, messageId: string) {
    if (type === 'channel') {
      const messageRef = doc(
        this.firestore,
        `channels/${id}/messages/${messageId}`
      );
      return docData(messageRef).pipe(
        map((data) => ({ id: messageRef.id, ...data }))
      );
    } else if (type === 'chat') {
      const messageRef = doc(
        this.firestore,
        `chats/${id}/messages/${messageId}`
      );
      return docData(messageRef).pipe(
        map((data) => ({ id: messageRef.id, ...data }))
      );
    }
    return of(null);
  }

  getChannelInfo(type: string, id: string): Observable<any> {
    if (type === 'channel') {
      const channelRef = doc(this.firestore, `channels/${id}`);
      return docData(channelRef);
    }
    return of([]);
  }
}
