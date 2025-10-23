import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnDestroy,
  WritableSignal,
} from '@angular/core';
import { BehaviorSubject, Observable, Subject, timer } from 'rxjs';
import {
  filter,
  switchMap,
  shareReplay,
  map,
  takeUntil,
  delayWhen,
  repeatWhen,
  takeWhile,
} from 'rxjs/operators';
import { UserInterface } from '../../models/user.interface';
import { AuthService } from '../../../services/auth.service';
import { ChatService } from '../../../services/chat.service';
import { UserService } from '../../../services/user.service';
import { CommonModule } from '@angular/common';
import { ConversationActiveRouterService } from '../../../services/conversation-active-router.service';
import { ScreenService } from '../../../services/screen.service';
import { ScreenSize } from '../../types/screen-size.type';
import { OverlayService } from '../../../services/overlay.service';
import { DashboardState } from '../../types/dashboard-state.type';
import { PresenceService } from '../../../services/presence.service';

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
  @Input() set user(value: UserInterface | undefined) {this.userUid$.next(value?.uid ?? null);}
  @Input() relatedToSearchResultPost = false;
  @Input() isInSearchResultsCurrentPostInput = false;
  @Input() doNothing = false;
  @Input() showProfile = false;
  @Input() inHeaderChat = false;
  @Output() userSelected = new EventEmitter<UserInterface>();

  userStatus$: Observable<any> | undefined;
  currentStatus$!: Observable<any>;
  private userUid$ = new BehaviorSubject<string | null>(null);
  private destroy$ = new Subject<void>();
  public dashboardState!: WritableSignal<DashboardState>;
  public screenSize$!: Observable<ScreenSize>;
  public user$: Observable<UserInterface | null>;
  public currentUserId$: Observable<string | null>;
  public lastUserSnapshot: UserInterface | null = null;
  private currentUserId: string | null = null;

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    public conversationActiveRouterService: ConversationActiveRouterService,
    private overlayService: OverlayService,
    public screenService: ScreenService,
    public userService: UserService,
    private presenceService: PresenceService
  ) {
    this.dashboardState = this.screenService.dashboardState;
    this.screenSize$ = this.screenService.screenSize$;
    this.user$ = this.userUid$.pipe(
      filter((uid): uid is string => !!uid),
      switchMap((uid) =>
        this.userService.getUserById(uid).pipe(
          repeatWhen((complete$) =>
            complete$.pipe(
              delayWhen(() => timer(100)),
              takeWhile((_, i) => i < 4)
            )
          ), filter((user): user is UserInterface => !!user)
        )
      ), shareReplay({ bufferSize: 1, refCount: true })
    );
    this.currentUserId$ = this.authService.currentUser$.pipe(map((u) => u?.uid ?? null));
    this.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe((u) => (this.lastUserSnapshot = u));
    this.currentUserId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => (this.currentUserId = id));
  }

  ngOnInit() {
    this.currentStatus$ = this.userUid$.pipe(
      filter((uid): uid is string => !!uid),
      switchMap((uid) => this.presenceService.getUserStatus(uid))
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Closes all overlays and navigates to the chat between the current user and the last selected user.
   * Does nothing if the current user ID or last user snapshot is not available.
   */
  async pickOutAndNavigateToChat() {
    if (!this.currentUserId || !this.lastUserSnapshot) return;
    this.overlayService.closeAll();
    this.chatService.navigateToChat(this.currentUserId, this.lastUserSnapshot);
  }

  /**
   * Determines the appropriate action when a user is selected:
   * - Emits the selected user if the selection came from search results.
   * - Opens the profile overlay if `showProfile` or `inHeaderChat` is true.
   * - Otherwise, navigates to the chat with the selected user.
   * Does nothing if the current user ID is not set, `doNothing` is true, or the last user snapshot is missing.
   */
  async choiceBetweenNavigateAndProfile() {
    if (!this.currentUserId || this.doNothing || !this.lastUserSnapshot) return;
    if (this.isInSearchResultsCurrentPostInput) {
      this.userSelected.emit(this.lastUserSnapshot);
    } else if (this.showProfile || this.inHeaderChat) {
      this.userService.openProfileOverlay(
        this.lastUserSnapshot.uid,
        this.currentUserId
      );
    } else this.pickOutAndNavigateToChat();
  }
}
