import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnDestroy,
} from '@angular/core';
import { BehaviorSubject, Observable, Subject, timer } from 'rxjs';
import { filter, switchMap, shareReplay, map, takeUntil, delayWhen, repeatWhen, takeWhile } from 'rxjs/operators';
import { UserInterface } from '../../models/user.interface';
import { AuthService } from '../../../services/auth.service';
import { ChatService } from '../../../services/chat.service';
import { UserService } from '../../../services/user.service';
import { CommonModule } from '@angular/common';
import { ConversationActiveRouterService } from '../../../services/conversation-active-router.service';
import { ScreenService } from '../../../services/screen.service';
import { ScreenSize } from '../../types/screen-size.type';
import { OverlayService } from '../../../services/overlay.service';

@Component({
  selector: 'app-user-list-item',
  imports: [CommonModule],
  templateUrl: './user-list-item.component.html',
  styleUrls: [
    './user-list-item.component.scss',
    './../../styles/list-item.scss',
  ],
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
  screenSize$!: Observable<ScreenSize>;
  // public Observable, das im Template per async-Pipe benutzt wird
  public user$: Observable<UserInterface | null>;
  // currentUserId als Observable (für template checks)
  public currentUserId$: Observable<string | null>;

  // zusätzlich: synchroner Snapshot für Methoden wie navigate (optional)
  lastUserSnapshot: UserInterface | null = null;
  currentUserId: string | null = null;

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    public conversationActiveRouterService: ConversationActiveRouterService,
    private overlayService: OverlayService,
    public screenService: ScreenService,
    private userService: UserService
  ) {
    this.screenSize$ = this.screenService.screenSize$;
    // Observable der Live-Userdaten (nur wenn uid vorhanden)
    this.user$ = this.userUid$.pipe(
      filter((uid): uid is string => !!uid),
      switchMap((uid) =>
        this.userService.getUserById(uid).pipe(
          // 🔁 Wiederhole, wenn docData noch nichts geliefert hat
          repeatWhen((complete$) =>
            complete$.pipe(
              delayWhen(() => timer(100)), // 100 ms warten
              takeWhile((_, i) => i < 4) // max. 5 Versuche
            )
          ),
          // nur emitten, wenn das Dokument existiert
          filter((user): user is UserInterface => !!user)
        )
      ),
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
      this.userService.openProfileOverlay(
        this.lastUserSnapshot.uid,
        this.currentUserId
      );
    } else {
      this.pickOutAndNavigateToChat();
    }
  }
}
