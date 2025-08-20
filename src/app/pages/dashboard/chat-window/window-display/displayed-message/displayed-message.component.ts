import { Component, inject, Input } from '@angular/core';
import { MessageInterface } from '../../../../../shared/models/message.interface';
import { AuthService } from '../../../../../services/auth.service';
import { UserInterface } from '../../../../../shared/models/user.interface';
import { UserService } from '../../../../../services/user.service';
import { Timestamp } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { OverlayComponent } from '../../../../../overlay/overlay.component';
import { OverlayService } from '../../../../../services/overlay.service';
import { FormsModule } from "@angular/forms";
import { ProfileViewOtherUsersComponent } from '../../../../../overlay/profile-view-other-users/profile-view-other-users.component';

@Component({
  selector: 'app-displayed-message', // Component to display a single message in the conversation
  imports: [CommonModule, OverlayComponent, FormsModule], 
  templateUrl: './displayed-message.component.html', // External HTML template
  styleUrl: './displayed-message.component.scss', // SCSS styles for this component
})
export class DisplayedMessageComponent {
  // Inject AuthService to get the current user's ID
  private authService = inject(AuthService);
  // Inject OverlayService to handle the overlays
  public overlayService = inject(OverlayService);
  // Inject UserService to fetch sender information
  private userService = inject(UserService);

  // Input message passed from the parent component
  @Input() message!: MessageInterface;

  // Properties related to the sender of the message
  senderId!: string;
  senderPhotoUrl?: string;
  senderName!: string;
  senderIsCurrentUser!: boolean;

  // Formatted time of when the message was created
  createdAtTime!: string;

  ngOnInit() {
    this.senderId = this.message.senderId; // Extract sender ID from the message
    this.checkIfSenderIsCurrentUser(); // Check if the sender is the logged-in user
    this.loadSenderInfo(); // Load sender's profile info (name, photo)
    this.formatCreatedAt(); // Format timestamp into a readable time
  }

  /**
   * Checks if the message was sent by the currently logged-in user
   * Used to adjust styling (e.g., alignment or colors)
   */
  checkIfSenderIsCurrentUser() {
    if (this.message && this.senderId == this.authService.getCurrentUserId()) {
      this.senderIsCurrentUser = true;
    }
  }

  /**
   * Fetches sender information (name, photo) from Firestore
   * Subscribes to updates in case the user data changes
   */
  loadSenderInfo() {
    this.userService.getUserById(this.senderId).subscribe({
      next: (user) => {
        this.senderPhotoUrl = user.photoUrl;
        this.senderName = user.name;
      },
      error: (err) => {
        console.error('Error loading user', err);
      },
    });
  }

  /**
   * Formats the createdAt timestamp into a human-readable HH:mm format
   * Supports both Firestore Timestamp and plain Date/number values
   */
  formatCreatedAt() {
    if (this.message?.createdAt) {
      let date: Date;

      if (this.message.createdAt instanceof Timestamp) {
        // Firestore Timestamp → convert to JS Date
        date = this.message.createdAt.toDate();
      } else {
        // Fallback if createdAt is already a Date or number
        date = new Date(this.message.createdAt);
      }

      // Format into local time string (HH:mm)
      this.createdAtTime = date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }

  /**
   * This method displays the profile view of another user.
   * It triggers the overlay service to open the ProfileViewOtherUsersComponent.
   */
  displayProfileViewOtherUser(){
    this.overlayService.displayOverlay(ProfileViewOtherUsersComponent, 'Profil');
  }
}
