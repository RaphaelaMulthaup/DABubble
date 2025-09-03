import { Component, inject, Input } from '@angular/core';
import { UserInterface } from '../../models/user.interface';
import { PostService } from '../../../services/post.service';
import { AuthService } from '../../../services/auth.service';
import { ChatService } from '../../../services/chat.service';
import { OverlayService } from '../../../services/overlay.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MobileService } from '../../../services/mobile.service';

@Component({
  selector: 'app-contact-list-item', // Component selector used in parent templates
  imports: [CommonModule],
  templateUrl: './contact-list-item.component.html', // External HTML template
  styleUrls: [
    './contact-list-item.component.scss',
    './../../styles/list-item.scss',
  ],
})
export class ContactListItemComponent {
  // Input property that receives a user object from the parent component
  @Input() user!: UserInterface;
  @Input() relatedToSearchResultPost: boolean = false;

  // Stores the ID of the currently logged-in user
  currentUserId: string | null = null;

  // Inject AuthService instance to access authentication-related methods
  private authService = inject(AuthService);

  // Inject ChatService instance to manage chat-related operations
  private chatService = inject(ChatService);

  public mobileService = inject(MobileService);

  constructor(private router: Router) {
    // Retrieve the currently logged-in user ID from AuthService
    this.currentUserId = this.authService.getCurrentUserId();
  }

  /**
   * Finds a chat between the current user and a selected user,
   * then navigates to it if it exists.
   */
  async pickOutAndNavigateToChat() {
    if (!this.currentUserId) return; // Stop if user is not logged in

    // Try to find a chat between the current user and the selected user
    const chatId = await this.chatService.getChatId(
      this.currentUserId,
      this.user.uid
    );

    if (!chatId) return; // No chat found → exit
    this.router.navigate(['/dashboard', 'chat', chatId]);
  }
}
