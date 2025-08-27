import { Component, Input, TemplateRef, ViewChild, ViewContainerRef, inject } from '@angular/core';
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

  // reactionSelectionVisible: boolean = false;
  isMessageFromCurrentUser!: boolean;
  @ViewChild('overlayTemplate') overlayTemplate!: TemplateRef<any>;
  private vcr = inject(ViewContainerRef);

  ngOnInit() {
    this.isMessageFromCurrentUser = this.message.senderId === this.authService.getCurrentUserId();
  }

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

  openEmojiPickerOverlay(event: MouseEvent) {
    const origin = event.currentTarget as HTMLElement;
    const ref = this.overlayService.openComponent(origin, EmojiPickerComponent);
    ref!.instance.messageFromCurrentUser = this.isMessageFromCurrentUser;
  }

  closeEmojiPickerOverlay() {
    this.overlayService.close();
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
