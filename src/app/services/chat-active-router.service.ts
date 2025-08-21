import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
} from '@angular/fire/firestore';
import { Observable, of, map } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

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

  getMessages(type: string, id: string): Observable<any[]> {
    if (type === 'channel') {
      const channelRef = collection(this.firestore, `channels/${id}/messages`);
      return collectionData(channelRef, { idField: 'id' });
    } else if (type === 'chat') {
      const ref = collection(this.firestore, `chats/${id}/messages`);
      return collectionData(ref, { idField: 'id' }); // returnează direct mesajele
    }
    return of([]);
  }

  getThreads(type: string, id: string, messageId: string): Observable<any[]> {
   if (type === 'channel') {
    const threadRef = collection(this.firestore, `channels/${id}/messages/${messageId}/messages`);
    return collectionData(threadRef, { idField: 'id' });
  } else if (type === 'chat') {
    const threadRef = collection(this.firestore, `chats/${id}/messages/${messageId}/messages`);
    return collectionData(threadRef, { idField: 'id' });
  }
  return of([]);
}

getMessageInfo(type: string, id: string, messageId: string) {
  if (type === 'channel') {
    const messageRef = doc(this.firestore, `channels/${id}/messages/${messageId}`);
    return docData(messageRef).pipe(
      map(data => ({ id: messageRef.id, ...data })) 
    );
  } else if (type === 'chat') {
    const messageRef = doc(this.firestore, `chats/${id}/messages/${messageId}`);
    return docData(messageRef).pipe(
      map(data => ({ id: messageRef.id, ...data })) 
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
