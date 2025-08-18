import { Component, inject, Input } from '@angular/core';
import { UserInterface } from '../../../../../shared/models/user.interface';
import { MessageService } from '../../../../../services/message.service';
import { AuthService } from '../../../../../services/auth.service';
import { ChatService } from '../../../../../services/chat.service';

@Component({
  selector: 'app-contact-list-item', // Component selector used in parent templates
  imports: [], // No standalone Angular imports here
  templateUrl: './contact-list-item.component.html', // External HTML template
  styleUrl: './contact-list-item.component.scss', // SCSS styles for this component
})
export class ContactListItemComponent {
  // Input property that receives a user object from the parent component
  @Input() user!: UserInterface;

  // Stores the ID of the currently logged-in user
  currentUserId: string | null = null;

  // Inject MessageService instance to handle message-related operations
  private messageService = inject(MessageService);

  // Inject AuthService instance to access authentication-related methods
  private authService = inject(AuthService);

  // Inject ChatService instance to manage chat-related operations
  private chatService = inject(ChatService);

  constructor() {
    // Retrieve the currently logged-in user ID from AuthService
    this.currentUserId = this.authService.getCurrentUserId();
  }

  /**
   * Loads messages for the selected contact
   * - Finds or checks for an existing chat between the current user and the selected user
   * - If a chat exists, retrieves it and provides its messages via MessageService
   */
  async handOverMessages() {
    if (!this.currentUserId) return; // Stop if user is not logged in

    // Try to find a chat between the current user and the selected user
    const chatId = await this.chatService.getChatId(
      this.currentUserId,
      this.user.uid
    );

    if (!chatId) return; // No chat found → exit

    // Subscribe to chat updates and provide its messages
    this.chatService.getChatById(chatId).subscribe((chat) => {
      if (chat) {
        this.messageService.provideMessages(chat, 'chats');
      }
    });
  }
}
