import { Component, Input, inject } from '@angular/core';
import { MessageInterface } from '../../../../../shared/models/message.interface';
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
import { MessageService } from '../../../../../services/message.service';


@Component({
  selector: 'app-displayed-post', // Component to display a single message in the conversation
  imports: [CommonModule, OverlayComponent, FormsModule, RouterLink],
  templateUrl: './displayed-post.component.html', // External HTML template
  styleUrl: './displayed-post.component.scss', // SCSS styles for this component
})
export class DisplayedPostComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  public overlayService = inject(OverlayService);
  public messageService = inject(MessageService);

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private chatActiveRoute = inject(ChatActiveRouterService);

  typ$!: Observable<string>;
  currentType!: string;
  currentChannelId!: string;

  // Input message passed from the parent component
  @Input() message!: MessageInterface;

  /** Observable für alle abhängigen Werte */
  senderName$!: Observable<string>;
  senderPhotoUrl$!: Observable<string | undefined>;
  senderIsCurrentUser$!: Observable<boolean>;
  createdAtTime$!: Observable<string>;
  reactions$!: Observable<ReactionInterface[]>;
  reactions: ReactionInterface[] = [];

  ngOnInit() { }

  ngOnChanges() {
    // this.senderId = this.message.senderId; // Extract sender ID from the message
    this.chatActiveRoute.getParams$(this.route).subscribe(({ type, id }) => {
      this.currentType = type;
      this.currentChannelId = id;
    });

    this.reactions$ = this.messageService.getReactions('/' + this.currentType + 's/' + this.currentChannelId, 'messages', this.message.id!);
    this.reactions$.subscribe(data => {
      this.reactions = data;
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

  reactionSelectionVisible: boolean = false;
  emojis = [
    'assets/img/emojis/grinning-face.svg',
    'assets/img/emojis/beaming-face.svg',
    'assets/img/emojis/face-with-tears-of-joy.svg',
    'assets/img/emojis/upside-down-face.svg',
    'assets/img/emojis/winking-face.svg',
    'assets/img/emojis/smiling-face-with-halo.svg',
    'assets/img/emojis/smiling-face-with-hearts.svg',
    'assets/img/emojis/smiling-face-with-heart-eyes.svg',
    'assets/img/emojis/face-blowing-a-kiss.svg',
    'assets/img/emojis/star-struck.svg',
    'assets/img/emojis/face-savoring-food.svg',
    'assets/img/emojis/smiling-face-with-open-hands.svg',
    'assets/img/emojis/face-with-peeking-eye.svg',
    'assets/img/emojis/shushing-face.svg',
    'assets/img/emojis/thinking-face.svg',
    'assets/img/emojis/saluting-face.svg',
    'assets/img/emojis/zipper-mouth-face.svg',
    'assets/img/emojis/neutral-face.svg',
    'assets/img/emojis/face-with-rolling-eyes.svg',
    'assets/img/emojis/relieved-face.svg',
    'assets/img/emojis/sleeping-face.svg',
    'assets/img/emojis/nauseated-face.svg',
    'assets/img/emojis/sneezing-face.svg',
    'assets/img/emojis/face-with-spiral-eyes.svg',
    'assets/img/emojis/exploding-head.svg',
    'assets/img/emojis/partying-face.svg',
    'assets/img/emojis/smiling-face-with-sunglasses.svg',
    'assets/img/emojis/slightly-frowning-face.svg',
    'assets/img/emojis/hushed-face.svg',
    'assets/img/emojis/face-holding-back-tears.svg',
    'assets/img/emojis/fearful-face.svg',
    'assets/img/emojis/sad-but-relieved-face.svg',
    'assets/img/emojis/loudly-crying-face.svg',
    'assets/img/emojis/angry-face.svg',
    'assets/img/emojis/skull.svg',
    'assets/img/emojis/pile-of-poop.svg',
    'assets/img/emojis/clown-face.svg',
    'assets/img/emojis/heart.svg',
    'assets/img/emojis/star.svg',
    'assets/img/emojis/waving-hand.svg',
    'assets/img/emojis/raised-hand.svg',
    'assets/img/emojis/ok-hand.svg',
    'assets/img/emojis/index-pointing-up.svg',
    'assets/img/emojis/thumbs-up.svg',
    'assets/img/emojis/thumbs-down.svg',
    'assets/img/emojis/clapping-hands.svg',
    'assets/img/emojis/handshake.svg',
    'assets/img/emojis/folded-hands.svg',
    'assets/img/emojis/flexed-biceps.svg',
    'assets/img/emojis/question-mark.svg',
    'assets/img/emojis/exclamation-mark.svg',
    'assets/img/emojis/check-mark.svg',
    'assets/img/emojis/cross-mark.svg',
  ]

  /**
  * This function uses the chosen emoji and the userId to react to a post
  */
  reactToPost(index: number) {
    console.log(this.emojis[index]);
    console.log(this.reactions)
  }


  
  // /**
  //  * Checks if the message was sent by the currently logged-in user
  //  * Used to adjust styling (e.g., alignment or colors)
  //  */
  // checkIfSenderIsCurrentUser() {
  //   if (this.message && this.senderId == this.authService.getCurrentUserId()) {
  //     this.senderIsCurrentUser = true;
  //   }
  // }

  // /**
  //  * Fetches sender information (name, photo) from Firestore
  //  * Subscribes to updates in case the user data changes
  //  */
  // loadSenderInfo() {
  //   this.userService.getUserById(this.senderId).subscribe({
  //     next: (user) => {
  //       this.senderPhotoUrl = user.photoUrl;
  //       this.senderName = user.name;
  //     },
  //     error: (err) => {
  //       console.error('Error loading user', err);
  //     },
  //   });
  // }

  // /**
  //  * Formats the createdAt timestamp into a human-readable HH:mm format
  //  * Supports both Firestore Timestamp and plain Date/number values
  //  */
  // formatCreatedAt() {
  //   if (this.message?.createdAt) {
  //     let date: Date;

  //     if (this.message.createdAt instanceof Timestamp) {
  //       // Firestore Timestamp → convert to JS Date
  //       date = this.message.createdAt.toDate();
  //     } else {
  //       // Fallback if createdAt is already a Date or number
  //       date = new Date(this.message.createdAt);
  //     }

  //     // Format into local time string (HH:mm)
  //     this.createdAtTime = date.toLocaleTimeString([], {
  //       hour: '2-digit',
  //       minute: '2-digit',
  //     });
  //   }
  // }
}
