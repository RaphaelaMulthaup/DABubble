import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  WritableSignal,
} from '@angular/core';
import { PostInterface } from '../../../../../../shared/models/post.interface';
import { AuthService } from '../../../../../../services/auth.service';
import { UserService } from '../../../../../../services/user.service';
import {
  combineLatest,
  defer,
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
} from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../../../../../services/overlay.service';
import { FormsModule } from '@angular/forms';
import { ProfileViewOtherUsersComponent } from '../../../../../../overlay/profile-view-other-users/profile-view-other-users.component';
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

@Component({
  selector: 'app-displayed-post', // Component to display a single message in the conversation
  imports: [CommonModule, FormsModule, EditDisplayedPostComponent],
  templateUrl: './displayed-post.component.html', // External HTML template
  styleUrl: './displayed-post.component.scss', // SCSS styles for this component
})
export class DisplayedPostComponent {
  @Input() post!: PostInterface;
  @Input() editingPost?: boolean;
  @Input() conversationWindowState?: 'conversation' | 'thread';
  // @Output() postLoaded = new EventEmitter<boolean>();

  screenSize$!: Observable<ScreenSize>;
  dashboardState!: WritableSignal<DashboardState>;
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
  senderIsCurrentUser!: boolean;
  allReactionsVisible: boolean = false;
  postClicked: boolean = false;
  isThreadTheme: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private route: ActivatedRoute,
    private conversationActiveRouterService: ConversationActiveRouterService,
    private reactionsService: ReactionsService,
    public overlayService: OverlayService,
    public postService: PostService,
    public screenService: ScreenService
  ) {
    this.screenSize$ = this.screenService.screenSize$;
    this.dashboardState = this.screenService.dashboardState;
  }

  ngOnChanges() {
    if (!this.post) return;
    this.conversationActiveRouterService
      .getParams$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ conversationType, conversationId }) => {
        this.currentConversationType = conversationType as 'channel' | 'chat';
        this.currentConversationId = conversationId;
      });

    this.conversationActiveRouterService
      .getMessageId$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe((messageId) => {
        if (this.conversationWindowState === 'thread') {
          messageId === this.post.id
            ? (this.isThreadTheme = true)
            : (this.isThreadTheme = false);
          this.parentMessageId = messageId;
        }
      });

    this.reactions$ = of(this.post).pipe(
      filter((post) => post.hasReactions === true),
      switchMap((post) =>
        this.parentMessageId
          ? this.reactionsService.getReactions(
              `/${this.currentConversationType}s/${this.currentConversationId}/messages/${this.parentMessageId}`,
              'answers',
              post.id!
            )
          : this.reactionsService.getReactions(
              `/${this.currentConversationType}s/${this.currentConversationId}`,
              'messages',
              post.id!
            )
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.visibleReactions$ = this.reactions$.pipe(
      map((list) =>
        list
          .filter((r) => r.users.length > 0)
          .sort((a, b) => b.users.length - a.users.length)
      ),
      distinctUntilChanged((a, b) => a === b),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    setTimeout(() => {
      if (!this.post) return;
      this.senderIsCurrentUser =
        this.post.senderId === this.authService.currentUser?.uid;
      const user$ = this.userService.getUserById(this.post.senderId);
      this.senderName$ = user$.pipe(map((u) => u?.name ?? ''));
      this.senderPhotoUrl$ = user$.pipe(map((u) => u?.photoUrl ?? ''));
      this.senderId$ = user$.pipe(map((u) => u?.uid ?? ''));
    });

    this.createdAtTime$ = of(this.post.createdAt).pipe(
      map((ts) => {
        let date: Date;
        if (ts instanceof Timestamp) {
          date = ts.toDate();
        } else {
          date = new Date(ts);
        }
        return date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      })
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * This method displays the profile view of another user.
   * It triggers the overlay service to open the ProfileViewOtherUsersComponent.
   */
  async openUserProfileOverlay() {
    const senderId = await firstValueFrom(this.senderId$);
    const currentUserId = this.authService.currentUser?.uid;
    if (!currentUserId) {
      return;
    }
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
        originPosition: await this.reactionsService.resolveEmojiPickerPosition(
          this.senderIsCurrentUser
        ),
      },
      {
        rightAngleTopRight:
          await this.reactionsService.checkEmojiPickerPosition(
            this.senderIsCurrentUser
          ),
      }
    );

    //das abonniert den event emitter vom emoji-picker component
    overlay!.ref.instance.selectedEmoji
      .pipe(take(1))
      .subscribe((emoji: { token: string; src: string }) => {
        if (this.parentMessageId) {
          this.reactionsService.toggleReaction(
            '/' +
              this.currentConversationType +
              's/' +
              this.currentConversationId +
              '/messages/' +
              this.parentMessageId,
            'answers',
            this.post.id!,
            emoji!
          );
        } else {
          this.reactionsService.toggleReaction(
            '/' +
              this.currentConversationType +
              's/' +
              this.currentConversationId,
            'messages',
            this.post.id!,
            emoji!
          );
        }
        this.overlayService.closeAll();
      });
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
          overlayX: 'end',
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
    overlay?.afterClosed$.pipe(take(1)).subscribe(() => {
      this.postClicked = false;
      // this.editingPost = this.overlayService.postToBeEdited;
    });
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

  /**
   * This function toggles the users reaction, if the users clicks on an already chosen emoji (by any user) in the reactions-div
   *
   *  @param emoji - the image-path for the chosen emoji.
   */
  toggleExistingReaction(emoji: { token: string; src: string }) {
    if (this.parentMessageId) {
      this.reactionsService.toggleReaction(
        '/' +
          this.currentConversationType +
          's/' +
          this.currentConversationId +
          '/messages/' +
          this.parentMessageId,
        'answers',
        this.post.id!,
        emoji!
      );
    } else {
      this.reactionsService.toggleReaction(
        '/' + this.currentConversationType + 's/' + this.currentConversationId,
        'messages',
        this.post.id!,
        emoji!
      );
    }
    this.overlayService.closeAll();
  }
}
