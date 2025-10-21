import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  WritableSignal,
} from '@angular/core';
import { PostInterface } from '../../../../../../shared/models/post.interface';
import { AuthService } from '../../../../../../services/auth.service';
import { UserService } from '../../../../../../services/user.service';
import {
  distinctUntilChanged,
  filter,
  firstValueFrom,
  map,
  of,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../../../../../services/overlay.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ConversationActiveRouterService } from '../../../../../../services/conversation-active-router.service';
import { Observable } from 'rxjs';
import { ReactionInterface } from '../../../../../../shared/models/reaction.interface';
import { PostService } from '../../../../../../services/post.service';
import { EmojiPickerComponent } from '../../../../../../overlay/emoji-picker/emoji-picker.component';
import { ReactedUsersComponent } from '../../../../../../overlay/reacted-users/reacted-users.component';
import { PostInteractionOverlayComponent } from '../../../../../../overlay/post-interaction-overlay/post-interaction-overlay.component';
import { EditDisplayedPostComponent } from './edit-displayed-post/edit-displayed-post.component';
import { EMOJIS } from '../../../../../../shared/constants/emojis';
import { ScreenSize } from '../../../../../../shared/types/screen-size.type';
import { ScreenService } from '../../../../../../services/screen.service';
import { ReactionsService } from '../../../../../../services/reactions.service';
import { DashboardState } from '../../../../../../shared/types/dashboard-state.type';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { UserInterface } from '../../../../../../shared/models/user.interface';

@Component({
  selector: 'app-displayed-post',
  imports: [CommonModule, FormsModule, EditDisplayedPostComponent],
  templateUrl: './displayed-post.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './displayed-post.component.scss',
})
export class DisplayedPostComponent implements OnInit {
  @Input() post!: PostInterface;
  @Input() editingPost?: boolean;
  @Input() conversationWindowState?: 'conversation' | 'thread';

  screenSize$!: Observable<ScreenSize>;
  dashboardState!: WritableSignal<DashboardState>;
  isLoaded$!: Observable<boolean>;
  senderName$!: Observable<string>;
  senderPhotoUrl$!: Observable<string | undefined>;
  senderId$!: Observable<string>;
  createdAtTime$!: Observable<string>;
  reactions$!: Observable<ReactionInterface[]>;
  visibleReactions$!: Observable<ReactionInterface[]>;
  private destroy$ = new Subject<void>();

  emojis = EMOJIS;
  currentConversationType!: 'channel' | 'chat';
  parentMessageId?: string;
  currentConversationId!: string;
  senderIsCurrentUser: boolean | null = null;
  allReactionsVisible: boolean = false;
  postClicked: boolean = false;
  isThreadTheme: boolean = false;

  constructor(
    private authService: AuthService,
    private conversationActiveRouterService: ConversationActiveRouterService,
    public overlayService: OverlayService,
    public postService: PostService,
    private reactionsService: ReactionsService,
    private route: ActivatedRoute,
    public screenService: ScreenService,
    private userService: UserService
  ) {
    this.dashboardState = this.screenService.dashboardState;
    this.screenSize$ = this.screenService.screenSize$;
  }

  ngOnInit() {
    if (!this.post || !this.post.senderId) {
      this.isLoaded$ = of(false);
      return;
    }
    const user$ = this.getSenderUserStream();
    this.senderName$ = user$.pipe(map((u) => u?.name ?? ''));
    this.senderPhotoUrl$ = user$.pipe(map((u) => u?.photoUrl ?? ''));
    this.senderId$ = user$.pipe(map((u) => u?.uid ?? ''));
    this.isLoaded$ = this.getIsLoadedStream(user$);
    this.initRouteParamsConversation();
    this.initRouteParamsMessage();
    this.createdAtTime$ = this.getFormattedPostTime(this.post.createdAt);
  }

  ngOnChanges() {
    if (!this.post) return;
    this.initRouteParamsConversation();
    this.initRouteParamsMessage();
    this.createdAtTime$ = this.getFormattedPostTime(this.post.createdAt);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Returns an observable of the sender user data for the current post.
   * Also sets `senderIsCurrentUser` to true if the sender is the current user.
   */
  getSenderUserStream(): Observable<UserInterface | undefined> {
    return this.userService.getUserById(this.post.senderId).pipe(
      tap((user) => {
        this.senderIsCurrentUser =
          user?.uid === this.authService.currentUser?.uid;
      }),
      shareReplay(1)
    );
  }

  /**
   * Returns an observable that emits the loaded state of a user.
   * Emits `true` if a user object exists, `false` otherwise.
   *
   * @param user$ - Observable of the user to track.
   */
  getIsLoadedStream(user$: Observable<UserInterface | undefined>): Observable<boolean> {
    return user$.pipe(
      map((user) => !!user),
      startWith(false),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

  /**
   * Converts a timestamp into a localized time string (HH:MM) and returns it as an observable.
   * Works for Firestore Timestamp instances or regular Date objects.
   * 
   * @param timestamp - The timestamp to format.
   */
  getFormattedPostTime(timestamp: any):Observable<string> {
    return of(timestamp).pipe(
      map((ts) => {
        const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }),
      shareReplay(1)
    );
  }

  /**
   * Subscribes to route parameters for conversation type and ID.
   * Updates the local state and reloads reactions whenever parameters change.
   */
  initRouteParamsConversation() {
    this.conversationActiveRouterService
    .getParams$(this.route)
    .pipe(takeUntil(this.destroy$))
    .subscribe(({ conversationType, conversationId }) => {
      this.currentConversationType = conversationType as 'channel' | 'chat';
      this.currentConversationId = conversationId;
      this.loadReactions();
    });
  }

  /**
   * Subscribes to the route message ID parameter.
   * Sets the thread state (`isThreadTheme` and `parentMessageId`) and reloads reactions
   * if the conversation window is currently displaying a thread.
   */
  initRouteParamsMessage() { 
    this.conversationActiveRouterService
    .getMessageId$(this.route)
    .pipe(takeUntil(this.destroy$))
    .subscribe((messageId) => {
      if (this.conversationWindowState === 'thread') {
        this.isThreadTheme = messageId === this.post?.id;
        this.parentMessageId = messageId;
        this.loadReactions();
      }
    });
  }

  /**
   * Loads all reactions for the current post.
   * Determines the correct Firestore path based on whether the post is a parent message or an answer,
   * fetches the reactions via the ReactionsService, and stores them in `reactions$`.
   * Also triggers loading of visible reactions.
   */
  loadReactions() {
    if (!this.post || !this.currentConversationType || !this.currentConversationId) return;
    this.reactions$ = of(this.post).pipe(
      filter((post) => post.hasReactions === true),
      switchMap((post) => {
        const basePath = this.parentMessageId
          ? `/${this.currentConversationType}s/${this.currentConversationId}/messages/${this.parentMessageId}`
          : `/${this.currentConversationType}s/${this.currentConversationId}`;
        const subcollection = this.parentMessageId ? 'answers' : 'messages';
        return this.reactionsService.getReactions(basePath, subcollection, post.id!);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    this.loadVisibleReactions()
  }

  /**
   * Filters and sorts reactions to show only those with at least one user.
   * The reactions are sorted by the number of users (descending) and stored in `visibleReactions$`.
   */
  loadVisibleReactions() {
    this.visibleReactions$ = this.reactions$.pipe(
      map((list) => list
        .filter((r) => r.users.length > 0)
        .sort((a, b) => b.users.length - a.users.length)
      ),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * This method displays the profile view of another user.
   * It triggers the overlay service to open the ProfileViewOtherUsersComponent.
   */
  async openUserProfileOverlay() {
    const senderId = await firstValueFrom(this.senderId$);
    const currentUserId = this.authService.currentUser?.uid;
    if (!currentUserId) return;
    this.userService.openProfileOverlay(senderId, currentUserId);
  }

  /**
   * This functions opens the emoji-picker overlay and transmits the isMessageFromCurrentUser-variable.
   * The overlay possibly emits an emoji and this emoji is used to react to the post.
   *
   * @param event the user-interaction with an object.
   */
  async openEmojiPickerOverlay(event: MouseEvent) {
    const overlay = this.overlayService.openComponent(
      EmojiPickerComponent,
      'cdk-overlay-transparent-backdrop',
      {
        origin: event.currentTarget as HTMLElement,
        originPosition: await this.reactionsService.resolveEmojiPickerPosition(this.senderIsCurrentUser!),
      },
      { rightAngleTopRight: await this.reactionsService.checkEmojiPickerPosition( this.senderIsCurrentUser!) }
    );
    overlay!.ref.instance.selectedEmoji
      .pipe(take(1))
      .subscribe((emoji: { token: string; src: string }) => this.togglePostReaction(emoji));
  }

  /**
   * This function toggles the users reaction, if the users clicks on an already chosen emoji (by any user) in the reactions-div
   *
   *  @param emoji - the image-path for the chosen emoji.
   */
  togglePostReaction(emoji: { token: string; src: string }) {
    this.parentMessageId?
      this.reactionsService.toggleReaction(
        '/' + this.currentConversationType + 's/' + this.currentConversationId + '/messages/' + this.parentMessageId,
        'answers',
        this.post.id!,
        emoji!
      ) : this.reactionsService.toggleReaction(
        '/' + this.currentConversationType + 's/' + this.currentConversationId,
        'messages',
        this.post.id!,
        emoji!
      );
    this.overlayService.closeAll();
  }

  /**
   * This functions opens the reacted-users-overlay.
   *
   * @param event the user-interaction with an object.
   * @param reaction the reaction, that is hovered over.
   */
  openReactedUsersOverlay(event: MouseEvent, reaction: ReactionInterface) {
    this.overlayService.openComponent(
      ReactedUsersComponent,
      'close-on-scroll',
      {
        origin: event.currentTarget as HTMLElement,
        originPosition: {
          originX: 'center',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
        },
        originPositionFallback: {
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom',
        },
      },
      { reaction: reaction }
    );
  }

  /**
   * This functions opens the post-interaction-overlay.
   * Fist it sets postClicked to true. It subscribes the overlays afterClosed$ Observable and sets postClicked to false, as the overlay closes.
   *
   * @param event the user-interaction with an object.
   */
  openPostInteractionOverlay(event: MouseEvent) {
    this.postClicked = true;
    const overlay = this.overlayService.openComponent(
      PostInteractionOverlayComponent,
      'cdk-overlay-transparent-backdrop',
      {
        origin: event.currentTarget as HTMLElement,
        originPosition: this.resolveInteractionOverlayPosition(),
      },
      {
        currentConversationType: this.currentConversationType,
        currentConversationId: this.currentConversationId,
        post: this.post,
        parentMessageId: this.parentMessageId,
        conversationWindowState: this.conversationWindowState,
      }
    );
    overlay?.afterClosed$.pipe(take(1)).subscribe(() => { this.postClicked = false });
  }

  /**
   * This function returns the connectedPosition for the post-interaction-overlay.
   * That position depends on whether the sender is the current user or not.
   */
  resolveInteractionOverlayPosition(): ConnectedPosition {
    if (this.senderIsCurrentUser) {
      return {
        originX: 'end',
        originY: 'top',
        overlayX: 'end',
        overlayY: 'bottom',
      };
    } else {
      return {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom',
      };
    }
  }
}