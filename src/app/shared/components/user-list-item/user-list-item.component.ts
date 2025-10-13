import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnDestroy,
} from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, switchMap, shareReplay, map, takeUntil } from 'rxjs/operators';
import { UserInterface } from '../../models/user.interface';
import { AuthService } from '../../../services/auth.service';
import { ChatService } from '../../../services/chat.service';
import { UserService } from '../../../services/user.service';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../../services/overlay.service';

@Component({
  selector: 'app-user-list-item',
  imports: [CommonModule],
  templateUrl: './user-list-item.component.html',
  styleUrls: ['./user-list-item.component.scss', './../../styles/list-item.scss'],
})
export class UserListItemComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  // Input als Setter: push UID in BehaviorSubject
  private userUid$ = new BehaviorSubject<string | null>(null);

  @Input()
  set user(value: UserInterface | undefined) {
    // falls der Parent ein volles User-Objekt liefert:
    this.userUid$.next(value?.uid ?? null);
  }

  // restliche Inputs
  @Input() relatedToSearchResultPost = false;
  @Input() isInSearchResultsCurrentPostInput = false;
  @Input() doNothing = false;
  @Input() showProfile = false;
  @Input() inHeaderChat = false;

  @Output() userSelected = new EventEmitter<UserInterface>();

  // public Observable, das im Template per async-Pipe benutzt wird
  public user$: Observable<UserInterface | null>;
  // currentUserId als Observable (für template checks)
  public currentUserId$: Observable<string | null>;

  // zusätzlich: synchroner Snapshot für Methoden wie navigate (optional)
  private lastUserSnapshot: UserInterface | null = null;
  currentUserId: string | null = null;

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private userService: UserService,
    private overlayService: OverlayService
  ) {
    // Observable der Live-Userdaten (nur wenn uid vorhanden)
    this.user$ = this.userUid$.pipe(
      filter((uid): uid is string => !!uid),
      switchMap((uid) => this.userService.getUserById(uid)),
      // optional: shareReplay damit mehrere async-pipes das selbe Subscription teilen
      shareReplay({ bufferSize: 1, refCount: true })
    );

    // currentUserId Observable
    this.currentUserId$ = this.authService.currentUser$.pipe(
      map((u) => u?.uid ?? null)
    );

    // halte synchronen Snapshot für Klick-Handler
    this.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe((u) => (this.lastUserSnapshot = u));

    this.currentUserId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => (this.currentUserId = id));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async pickOutAndNavigateToChat() {
    if (!this.currentUserId || !this.lastUserSnapshot) return;
    this.overlayService.closeAll();
    this.chatService.navigateToChat(this.currentUserId, this.lastUserSnapshot);
  }

  async choiceBetweenNavigateAndProfile() {
    if (!this.currentUserId || this.doNothing || !this.lastUserSnapshot) return;

    if (this.isInSearchResultsCurrentPostInput) {
      this.userSelected.emit(this.lastUserSnapshot);
    } else if (this.showProfile || this.inHeaderChat) {
      this.userService.openProfileOverlay(this.lastUserSnapshot.uid, this.currentUserId);
    } else {
      this.pickOutAndNavigateToChat();
    }
  }
}
