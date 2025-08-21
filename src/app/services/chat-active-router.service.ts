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
      const channelRef = collection(this.firestore, `channels/${id}/threads`);
      return collectionData(channelRef, { idField: 'id' });
    } else if (type === 'chat') {
      const ref = collection(this.firestore, `chats/${id}/messages`);
      return collectionData(ref, { idField: 'id' }); // returnează direct mesajele
    }
    return of([]);
  }

  getChannelInfo(type:string, id: string): Observable<any> {
    if(type === 'channel'){
      const channelRef = doc(this.firestore, `channels/${id}`);
      return docData(channelRef);
    }
    return of([]);
  }
}
