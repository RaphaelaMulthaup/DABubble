import { Component, Input } from '@angular/core';
import { ChatService } from '../../../../../services/chat.service';
import { AuthService } from '../../../../../services/auth.service';
import { UserInterface } from '../../../../../shared/models/user.interface';
import { Observable } from 'rxjs';
import { UserService } from '../../../../../services/user.service';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../../../../services/overlay.service';
import { ProfileViewOtherUsersComponent } from '../../../../../overlay/profile-view-other-users/profile-view-other-users.component';

@Component({
  selector: 'app-empty-chat-view',
  imports: [CommonModule], // Standalone component imports
  templateUrl: './empty-chat-view.component.html',
  styleUrl: './empty-chat-view.component.scss',
})
export class EmptyChatViewComponent {
  @Input() currentChatId!: string; // Input property to identify the current chat
  currentUserId!: string; // Stores the current logged-in user's ID
  ownChat: boolean = false; // Flag to indicate if the current chat is with the user themself
  user$!: Observable<UserInterface>; // Observable for the other user's data

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private userService: UserService,
    private overlayService: OverlayService
  ) {}

  /** 
   * Lifecycle hook called after component initialization.
   * Initializes currentUserId, retrieves the other user ID, fetches the user data as an Observable,
   * and checks if the chat is with the current user themselves.
   */
  ngOnInit() {
    this.currentUserId = this.authService.getCurrentUserId()!;

    // Get the ID of the other user in the chat
    let userId = this.chatService.getOtherUserId(
      this.currentChatId,
      this.currentUserId
    );

    // Fetch the other user's data as an Observable
    this.user$ = this.userService.getUserById(userId);

    // Determine if the chat is with the current user themselves
    if (this.currentUserId === userId) {
      this.ownChat = true;
    }
  }

  /** 
   * Opens the overlay to display the other user's profile.
   * Passes the user Observable to the overlay component.
   */
  openProfileOverlay() {
    this.overlayService.openComponent(
      ProfileViewOtherUsersComponent, // Overlay component to open
      'cdk-overlay-dark-backdrop',    // Backdrop style for the overlay
      { globalPosition: 'center' },   // Position overlay in the center of the screen
      { user$: this.user$ }            // Pass the user Observable as input to the overlay
    );
  }
}
