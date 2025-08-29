import { Component, Input, TemplateRef, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { PostInterface } from '../../../../../shared/models/post.interface';
import { AuthService } from '../../../../../services/auth.service';
import { UserService } from '../../../../../services/user.service';
import { map, switchMap, of } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { OverlayComponent } from '../../../../../overlay/overlay.component';
import { OverlayService } from '../../../../../services/overlay.service';
import { FormsModule } from '@angular/forms';
import { ProfileViewOtherUsersComponent } from '../../../../../overlay/profile-view-other-users/profile-view-other-users.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChatActiveRouterService } from '../../../../../services/chat-active-router.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { ReactionInterface } from '../../../../../shared/models/reaction.interface';
import { PostService } from '../../../../../services/post.service';
import { EmojiPickerComponent } from '../../../../../shared/components/emoji-picker/emoji-picker.component';

@Component({
  selector: 'app-displayed-post', // Component to display a single message in the conversation
  imports: [CommonModule, OverlayComponent, FormsModule, RouterLink, EmojiPickerComponent],
  templateUrl: './displayed-post.component.html', // External HTML template
  styleUrl: './displayed-post.component.scss', // SCSS styles for this component
})
export class DisplayedPostComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  public overlayService = inject(OverlayService);
  public postService = inject(PostService);

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private chatActiveRoute = inject(ChatActiveRouterService);

  typ$!: Observable<string>;
  currentType!: string;
  currentChannelId!: string;

  // Input message passed from the parent component
  @Input() message!: PostInterface;

  /** Observable für alle abhängigen Werte */
  senderName$!: Observable<string>;
  senderPhotoUrl$!: Observable<string | undefined>;
  senderIsCurrentUser$!: Observable<boolean>;
  createdAtTime$!: Observable<string>;
  reactions$!: Observable<ReactionInterface[]>;
  reactions: ReactionInterface[] = [];
  answers$!: Observable<PostInterface[]>;
  answers: PostInterface[] = [];

  isMessageFromCurrentUser!: boolean;

  @ViewChild('overlayTemplate') overlayTemplate!: TemplateRef<any>;
  private vcr = inject(ViewContainerRef);

  ngOnInit() {
    this.isMessageFromCurrentUser = this.message.senderId === this.authService.getCurrentUserId();
  }

  ngOnChanges() {
    this.chatActiveRoute.getParams$(this.route).subscribe(({ type, id }) => {
      this.currentType = type;
      this.currentChannelId = id;
    });

    this.reactions$ = this.postService.getReactions('/' + this.currentType + 's/' + this.currentChannelId, 'messages', this.message.id!);
    // this.reactions$.subscribe(data => {
    //   this.reactions = data;
    //   // console.log(this.reactions)
    // });

    this.answers$ = this.postService.getAnswers('/' + this.currentType + 's/' + this.currentChannelId, 'messages', this.message.id!);
    this.answers$.subscribe(data => {
      this.answers = data;
    });

    if (!this.message) return;
    // Prüfen, ob der Sender aktuell ist
    this.senderIsCurrentUser$ = of(
      this.message.senderId === this.authService.getCurrentUserId()
    );

    // Userdaten laden
    const user$ = this.userService.getUserById(this.message.senderId);
    this.senderName$ = user$.pipe(map((u) => u?.name ?? ''));
    this.senderPhotoUrl$ = user$.pipe(map((u) => u?.photoUrl ?? ''));

    // Zeit formatieren
    this.createdAtTime$ = of(this.message.createdAt).pipe(
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

  openAnswers(messageId: string) {
    const type = this.currentType;
    const id = this.currentChannelId;
    this.router.navigate(['/dashboard', type, id, 'answers', messageId]);
  }

  /**
 * This method displays the profile view of another user.
 * It triggers the overlay service to open the ProfileViewOtherUsersComponent.
 */
  displayProfileViewOtherUser() {
    const user$ = this.userService.getUserById(this.message.senderId);
    this.overlayService.displayOverlay(
      ProfileViewOtherUsersComponent,
      'Profil',
      {
        user$: user$,
      }
    );
  }

  /**
   * This functions opens the emoji-picker overlay and transmits the isMessageFromCurrentUser-variable.
   * The overlay possibly emits an emoji and this emoji is used to react to the post.
   */
  openEmojiPickerOverlay(event: MouseEvent) {
    const origin = event.currentTarget as HTMLElement;
    const ref = this.overlayService.openComponent(origin, EmojiPickerComponent);
    ref!.instance.messageFromCurrentUser = this.isMessageFromCurrentUser;

    //das abonniert den event emitter vom emoji-picker component
    ref!.instance.selectedEmoji.subscribe((emoji: string) => {
      this.postService.toggleReaction(
        '/' + this.currentType + 's/' + this.currentChannelId,
        'messages',
        this.message.id!,
        emoji
      )
      this.overlayService.close();
    });
  }

  /**
   * This functions closese the emoji-picker-overlay
   */
  closeEmojiPickerOverlay() {
    this.overlayService.close();
  }

  /**
   * This functions toggles the users reaction, if the users clicks on an already chosen emoji (by any user) in the reactions-div
   * 
   *  @param emoji - the image-path for the chosen emoji.
   */
  toggleExistingReaction(emoji: string) {
    this.postService.toggleReaction(
      '/' + this.currentType + 's/' + this.currentChannelId,
      'messages',
      this.message.id!,
      emoji
    )
  }
}
