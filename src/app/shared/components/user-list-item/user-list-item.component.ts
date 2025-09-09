import { Component, inject, Input } from '@angular/core';
import { UserInterface } from '../../models/user.interface';
import { PostService } from '../../../services/post.service';
import { AuthService } from '../../../services/auth.service';
import { ChatService } from '../../../services/chat.service';
import { OverlayService } from '../../../services/overlay.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MobileService } from '../../../services/mobile.service';
import { ProfileViewOtherUsersComponent } from '../../../overlay/profile-view-other-users/profile-view-other-users.component';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-user-list-item', // Component selector used in parent templates
  imports: [CommonModule],
  templateUrl: './user-list-item.component.html', // External HTML template
  styleUrls: [
    './user-list-item.component.scss',
    './../../styles/list-item.scss',
  ],
})
export class UserListItemComponent {
  // Input property that receives a user object from the parent component
  @Input() user!: UserInterface;
  @Input() relatedToSearchResultPost: boolean = false;
  @Input() inCurrentPostInput = false;
  @Input() doNothing: boolean = false;
  @Input() showProfile: boolean = false;
  @Input() inHeaderChat: boolean = false;

  // Stores the ID of the currently logged-in user
  currentUserId: string | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private chatService: ChatService,
    private overlayService: OverlayService,
    public mobileService: MobileService
  ) {
    // Retrieve the currently logged-in user ID from AuthService
    this.currentUserId = this.authService.currentUser.uid;
  }

  /**
   * Finds a chat between the current user and a selected user,
   * then navigates to it if it exists.
   */
  async pickOutAndNavigateToChat() {
    if (!this.currentUserId) return; // Stop if user is not logged in
    // this.mobileService.setMobileDashboardState('message-window');
    this.chatService.navigateToChat(this.currentUserId, this.user);
  }

  async choiceBetweenNavigateAndProfile() {
    if (!this.currentUserId) return; // Stop if user is not logged in
    if (this.doNothing) return;
    if (this.showProfile || this.inHeaderChat) {
      this.openProfileOverlay();
    } else {
      this.pickOutAndNavigateToChat();
    }
  }

  openProfileOverlay() {
    this.overlayService.openComponent(
      ProfileViewOtherUsersComponent,
      'cdk-overlay-dark-backdrop',
      { globalPosition: 'center' },
      { user$: of(this.user) }
    );
  }
}
