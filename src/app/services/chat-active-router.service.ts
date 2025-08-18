import { Injectable, inject } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { ChannelSelectionService } from './channel-selection.service';
import { Observable, switchMap, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatActiveRouterService {
  // Inject Firestore instance
  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);

  messages$!: Observable<any[]>;

  constructor() {
    this.messages$ = this.route.paramMap.pipe(
      switchMap((params) => {
        const type = params.get('type');
        const id = params.get('id');
      })
    );
  }
}
