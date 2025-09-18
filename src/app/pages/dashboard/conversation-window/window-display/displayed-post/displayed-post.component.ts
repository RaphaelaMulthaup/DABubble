import {
  Component,
  HostListener,
  Input,
  Output,
  WritableSignal,
  inject,
} from '@angular/core';
import { PostInterface } from '../../../../../shared/models/post.interface';
import { AuthService } from '../../../../../services/auth.service';
import { UserService } from '../../../../../services/user.service';
import {
  distinctUntilChanged,
  filter,
  map,
  of,
  shareReplay,
  Subject,
  Subscribable,
  Subscription,
  switchMap,
  take,
  takeUntil,
} from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../../../../services/overlay.service';
import { FormsModule } from '@angular/forms';
import { ProfileViewOtherUsersComponent } from '../../../../../overlay/profile-view-other-users/profile-view-other-users.component';
import { ActivatedRoute } from '@angular/router';
import { ConversationActiveRouterService } from '../../../../../services/conversation-active-router.service';
import { Observable } from 'rxjs';
import { ReactionInterface } from '../../../../../shared/models/reaction.interface';
import { PostService } from '../../../../../services/post.service';
import { EmojiPickerComponent } from '../../../../../overlay/emoji-picker/emoji-picker.component';
import { ReactedUsersComponent } from '../../../../../overlay/reacted-users/reacted-users.component';
import { PostInteractionOverlayComponent } from '../../../../../overlay/post-interaction-overlay/post-interaction-overlay.component';
import { MobileService } from '../../../../../services/mobile.service';
import { EditDisplayedPostComponent } from './edit-displayed-post/edit-displayed-post.component';
import { EMOJIS } from '../../../../../shared/constants/emojis';
import { ScreenSize } from '../../../../../shared/types/screen-size.type';
import { ScreenService } from '../../../../../services/screen.service';

@Component({
  selector: 'app-displayed-post', // Component to display a single message in the conversation
  imports: [CommonModule, FormsModule, EditDisplayedPostComponent],
  templateUrl: './displayed-post.component.html', // External HTML template
  styleUrl: './displayed-post.component.scss', // SCSS styles for this component
})
export class DisplayedPostComponent {
  @Input() @Output() post!: PostInterface;
  @Input() editingPost?: boolean;
  emojis = EMOJIS;
  currentConversationType!: 'channel' | 'chat';
  currentConversationId!: string;
  senderName$!: Observable<string>;
  senderPhotoUrl$!: Observable<string | undefined>;
  senderIsCurrentUser!: boolean;
  createdAtTime$!: Observable<string>;
  reactions$!: Observable<ReactionInterface[]>;
  visibleReactions$!: Observable<ReactionInterface[]>;
  allReactionsVisible: boolean = false;
  postClicked: boolean = false;
  isThreadTheme: boolean = false;
  parentMessageId?: string; //the id of the message, an answer belongs to -> only if the message is an answer
  screenSize$!: Observable<ScreenSize>;
  @Input() conversationWindowState?: 'conversation' | 'thread';
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private route: ActivatedRoute,
    private conversationActiveRouterService: ConversationActiveRouterService,
    public overlayService: OverlayService,
    public postService: PostService,
    public screenService: ScreenService,
    public mobileService: MobileService
  ) {
    this.screenSize$ = this.screenService.screenSize$;
  }

  async ngOnChanges() {
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
          ? this.postService.getReactions(
              `/${this.currentConversationType}s/${this.currentConversationId}/messages/${this.parentMessageId}`,
              'answers',
              post.id!
            )
          : this.postService.getReactions(
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
      )
    );

    if (!this.post) return;
    const user = await firstValueFrom(this.authService.currentUser$);
    this.senderIsCurrentUser = this.post.senderId === user?.uid;
    const user$ = this.userService.getUserById(this.post.senderId);
    this.senderName$ = user$.pipe(map((u) => u?.name ?? ''));
    this.senderPhotoUrl$ = user$.pipe(map((u) => u?.photoUrl ?? ''));

    // Zeit formatieren
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
  openUserProfileOverlay() {
    this.overlayService.openComponent(
      ProfileViewOtherUsersComponent,
      'cdk-overlay-dark-backdrop',
      { globalPosition: 'center' },
      { user$: this.userService.getUserById(this.post.senderId) }
    );
  }

  /**
   * This functions opens the emoji-picker overlay and transmits the isMessageFromCurrentUser-variable.
   * The overlay possibly emits an emoji and this emoji is used to react to the post.
   *
   * @param event the user-interaction with an object.
   */
  openEmojiPickerOverlay(event: MouseEvent) {
    const overlay = this.overlayService.openComponent(
      EmojiPickerComponent,
      'cdk-overlay-transparent-backdrop',
      {
        origin: event.currentTarget as HTMLElement,
        originPosition: {
          originX: 'end',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'top',
        },
        originPositionFallback: {
          originX: 'start',
          originY: 'top',
          overlayX: 'end',
          overlayY: 'top',
        },
      },
      { senderIsCurrentUser: this.senderIsCurrentUser }
    );

    //das abonniert den event emitter vom emoji-picker component
    overlay!.ref.instance.selectedEmoji
      .pipe(take(1))
      .subscribe((emoji: { token: string; src: string }) => {
        if (this.parentMessageId) {
          this.postService.toggleReaction(
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
          this.postService.toggleReaction(
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
        originPosition: {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
        },
        originPositionFallback: {
          originX: 'end',
          originY: 'top',
          overlayX: 'end',
          overlayY: 'bottom',
        },
      },
      {
        currentConversationType: this.currentConversationType,
        currentConversationId: this.currentConversationId,
        post: this.post,
        parentMessageId: this.parentMessageId,
      }
    );
    overlay?.afterClosed$.pipe(take(1)).subscribe(() => {
      this.postClicked = false;
      // this.editingPost = this.overlayService.postToBeEdited;
    });
  }

  /**
   * This function toggles the users reaction, if the users clicks on an already chosen emoji (by any user) in the reactions-div
   *
   *  @param emoji - the image-path for the chosen emoji.
   */
  toggleExistingReaction(emoji: { token: string; src: string }) {
    if (this.parentMessageId) {
      this.postService.toggleReaction(
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
      this.postService.toggleReaction(
        '/' + this.currentConversationType + 's/' + this.currentConversationId,
        'messages',
        this.post.id!,
        emoji!
      );
    }
    this.overlayService.closeAll();
  }
}
