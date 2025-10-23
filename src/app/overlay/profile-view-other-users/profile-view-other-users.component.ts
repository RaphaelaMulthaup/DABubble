import { AsyncPipe, CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { UserInterface } from '../../shared/models/user.interface';
import { OverlayService } from '../../services/overlay.service';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { HeaderOverlayComponent } from '../../shared/components/header-overlay/header-overlay.component';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-profile-view-other-users',
  imports: [AsyncPipe, HeaderOverlayComponent, CommonModule],
  templateUrl: './profile-view-other-users.component.html',
  styleUrl: './profile-view-other-users.component.scss',
})

export class ProfileViewOtherUsersComponent {
  user$!: Observable<UserInterface>;

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private overlayService: OverlayService,
    public userService: UserService
  ) {}

  /**
   * Opens a chat with the user currently displayed in the overlay.
   * - Retrieves the current user ID and the other user as uSerInterface
   * - Ensures the chat exists or creates it if necessary
   * - Navigates to the chat view
   * - Closes the overlay
   */
  async openChat() {
    const currentUserId = this.authService.currentUser?.uid;
    if (!currentUserId) return;
    const user = await firstValueFrom(this.user$);
    this.chatService.navigateToChat(currentUserId, user);
    this.overlayService.closeAll();
  }
}
