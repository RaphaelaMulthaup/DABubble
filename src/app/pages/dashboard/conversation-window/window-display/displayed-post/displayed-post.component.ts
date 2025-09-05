import { Component, Input, Output, WritableSignal, inject } from '@angular/core';
import { PostInterface } from '../../../../../shared/models/post.interface';
import { AuthService } from '../../../../../services/auth.service';
import { UserService } from '../../../../../services/user.service';
import { map, of } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../../../../services/overlay.service';
import { FormsModule } from '@angular/forms';
import { ProfileViewOtherUsersComponent } from '../../../../../overlay/profile-view-other-users/profile-view-other-users.component';
import { ActivatedRoute } from '@angular/router';
import { ChatActiveRouterService } from '../../../../../services/chat-active-router.service';
import { Observable } from 'rxjs';
import { ReactionInterface } from '../../../../../shared/models/reaction.interface';
import { PostService } from '../../../../../services/post.service';
import { EmojiPickerComponent } from '../../../../../overlay/emoji-picker/emoji-picker.component';
import { ReactedUsersComponent } from '../../../../../overlay/reacted-users/reacted-users.component';
import { PostInteractionOverlayComponent } from '../../../../../overlay/post-interaction-overlay/post-interaction-overlay.component';
import { MobileService } from '../../../../../services/mobile.service';
import { EditDisplayedPostComponent } from './edit-displayed-post/edit-displayed-post.component';

@Component({
  selector: 'app-displayed-post', // Component to display a single message in the conversation
  imports: [CommonModule, FormsModule, EditDisplayedPostComponent],
  templateUrl: './displayed-post.component.html', // External HTML template
  styleUrl: './displayed-post.component.scss', // SCSS styles for this component
})
export class DisplayedPostComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  public overlayService = inject(OverlayService);
  public postService = inject(PostService);
  public mobileService = inject(MobileService);
  private route = inject(ActivatedRoute);
  private chatActiveRoute = inject(ChatActiveRouterService);

  typ$!: Observable<string>;
  currentType!: 'channel' | 'chat';
  currentConversationId!: string;

  // Input message passed from the parent component
  @Input() @Output() post!: PostInterface;

  /** Observable für alle abhängigen Werte */
  senderName$!: Observable<string>;
  senderPhotoUrl$!: Observable<string | undefined>;
  senderIsCurrentUser$!: Observable<boolean>;
  createdAtTime$!: Observable<string>;
  reactions$!: Observable<ReactionInterface[]>;
  // reactions: ReactionInterface[] = [];
  visibleReactions$!: Observable<ReactionInterface[]>;
  // answers$?: Observable<PostInterface[]>;
  // answers: PostInterface[] = [];

  allReactionsVisible: boolean = false;
  postClicked: boolean = false;
  @Input() editingPost?: boolean;

  ngOnChanges() {
    this.chatActiveRoute.getParams$(this.route).subscribe(({ type, id }) => {
      this.currentType = type as 'channel' | 'chat';
      this.currentConversationId = id;
    });

    this.reactions$ = this.postService.getReactions(
      '/' + this.currentType + 's/' + this.currentConversationId,
      'messages',
      this.post.id!
    );
    this.visibleReactions$ = this.reactions$.pipe(
      map((list) =>
        list
          .filter((r) => r.users.length > 0)
          .sort((a, b) => b.users.length - a.users.length)
      )
    );

    // this.answers$ = this.postService
    //   .getAnswers(
    //     '/' + this.currentType + 's/' + this.currentConversationId,
    //     'messages',
    //     this.post.id!
    //   )
    //   .pipe(map((answers) => answers ?? []));
    // this.answers$.subscribe((data) => {
    //   this.answers = data;
    // });

    if (!this.post) return;
    // Prüfen, ob der Sender aktuell ist
    this.senderIsCurrentUser$ = of(
      this.post.senderId === this.authService.currentUser.uid
    );

    // Userdaten laden
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
      { senderIsCurrentUser$: this.senderIsCurrentUser$ }
    );

    //das abonniert den event emitter vom emoji-picker component
    overlay!.ref.instance.selectedEmoji.subscribe((emoji: string) => {
      this.postService.toggleReaction(
        '/' + this.currentType + 's/' + this.currentConversationId,
        'messages',
        this.post.id!,
        emoji
      );
      this.overlayService.close();
    });
  }

  /**
   * This functions opens the reacted-users-overlay.
   */
  openReactedUsersOverlay(event: MouseEvent, reaction: ReactionInterface) {
    this.overlayService.openComponent(
      ReactedUsersComponent,
      null,
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
        currentType: this.currentType,
        currentConversationId: this.currentConversationId,
        post: this.post,
      }
    );
    overlay?.afterClosed$.subscribe(() => {
      this.postClicked = false;
      this.editingPost = this.overlayService.editConfirmed;
    });
  }

  /**
   * This function toggles the users reaction, if the users clicks on an already chosen emoji (by any user) in the reactions-div
   *
   *  @param emoji - the image-path for the chosen emoji.
   */
  toggleExistingReaction(emoji: string) {
    this.postService.toggleReaction(
      '/' + this.currentType + 's/' + this.currentConversationId,
      'messages',
      this.post.id!,
      emoji
    );
  }
}
