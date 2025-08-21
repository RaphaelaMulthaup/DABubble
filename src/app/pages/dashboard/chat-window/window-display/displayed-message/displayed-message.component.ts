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
import { ThreadService } from '../../../../../services/thread.service';


@Component({
  selector: 'app-displayed-message', // Component to display a single message in the conversation
  imports: [CommonModule, OverlayComponent, FormsModule, RouterLink],
  templateUrl: './displayed-message.component.html', // External HTML template
  styleUrl: './displayed-message.component.scss', // SCSS styles for this component
})
export class DisplayedMessageComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  public overlayService = inject(OverlayService);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private threadService = inject(ThreadService);

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

  ngOnChanges() {
    if (!this.message) return;
    // Prüfen, ob der Sender aktuell ist
    this.senderIsCurrentUser$ = of(
      this.message.senderId === this.authService.getCurrentUserId()
    );

    // Userdaten laden
    const user$ = this.userService.getUserById(this.message.senderId);

    this.senderName$ = user$.pipe(map((u) => u.name));
    this.senderPhotoUrl$ = user$.pipe(map((u) => u.photoUrl));

    // Zeit formatieren
    this.createdAtTime$ = of(this.message.createdAt).pipe(
      map((ts) => {
        let date: Date;
        if (ts instanceof Timestamp) {
          date = ts.toDate();
        } else {
          date = new Date(ts);
        }
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      })
    );
  }

  openThread(messageId: string) {
    const type = this.currentType;
    const id = this.currentChannelId;
    this.router.navigate(['/dashboard', type, id, 'messages', messageId]);
  }

  /**
 * This method displays the profile view of another user.
 * It triggers the overlay service to open the ProfileViewOtherUsersComponent.
 */
  displayProfileViewOtherUser() {
    this.overlayService.displayOverlay(ProfileViewOtherUsersComponent, 'Profil');
  }

  // ngOnInit() {

  //   this.senderId = this.message.senderId; // Extract sender ID from the message
  //   // this.checkIfSenderIsCurrentUser(); // Check if the sender is the logged-in user
  //   // this.loadSenderInfo(); // Load sender's profile info (name, photo)
  //   // this.formatCreatedAt(); // Format timestamp into a readable time
  //   this.chatActiveRoute.getParams$(this.route).subscribe(({ type, id }) => {
  //   this.currentType = type;
  //   this.currentChannelId = id;
  // });
  // }

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
