import { AsyncPipe } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { User } from '@angular/fire/auth';
import { combineLatest, firstValueFrom, Observable } from 'rxjs';
import { UserInterface } from '../../shared/models/user.interface';
import { OverlayService } from '../../services/overlay.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import {
  collection,
  query,
  where,
  getDocs,
  Firestore,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { HeaderOverlayComponent } from '../../shared/components/header-overlay/header-overlay.component';

@Component({
  selector: 'app-profile-view-other-users',
  imports: [AsyncPipe, HeaderOverlayComponent],
  templateUrl: './profile-view-other-users.component.html',
  styleUrl: './profile-view-other-users.component.scss',
})
/**
 * Component for displaying another user's profile in an overlay.
 * Allows the current user to open a chat with the displayed user.
 */
export class ProfileViewOtherUsersComponent {
  user$!: Observable<UserInterface>;

  constructor(
    private router: Router 
    /** Firestore instance used for database operations */,
    private firestore: Firestore,
    /** Service for controlling overlays */
    private overlayService: OverlayService,
    /** Service for authentication-related data */
    private authService: AuthService,
    /** Service for managing user-related data */
    private userService: UserService,
    /** Service for managing chat-related logic */
    private chatService: ChatService
  ) {}

  /**
   * Opens a chat with the user currently displayed in the overlay.
   * - Retrieves the current user and the other user's ID
   * - Ensures the chat exists or creates it if necessary
   * - Navigates to the chat view
   * - Closes the overlay
   */
  async openChat() {
    const currentUserId = this.authService.currentUser?.uid;
    if (!currentUserId) return;

    // Convert user observable to a single value
    const user = await firstValueFrom(this.user$);

    this.chatService.navigateToChat(currentUserId, user);

    // Hide the overlay
    this.overlayService.closeAll();
  }
}
