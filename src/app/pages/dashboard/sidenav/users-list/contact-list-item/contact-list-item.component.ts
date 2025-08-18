import { Component, inject, Input } from '@angular/core';
import { UserInterface } from '../../../../../shared/models/user.interface';
import { MessageService } from '../../../../../services/message.service';
import { AuthService } from '../../../../../services/auth.service';
import { ChatService } from '../../../../../services/chat.service';

@Component({
  selector: 'app-contact-list-item',
  imports: [],
  templateUrl: './contact-list-item.component.html',
  styleUrl: './contact-list-item.component.scss',
})
export class ContactListItemComponent {
  @Input() user!: UserInterface;
  // ID of the currently logged-in user
  currentUserId: string | null = null;

  // Inject MessageService instance to handle messages
  private messageService = inject(MessageService);
  // Inject AuthService instance to handle authentication
  private authService = inject(AuthService);
  // Inject ChatService instance to handle chats
  private chatService = inject(ChatService);

  constructor() {
    this.currentUserId = this.authService.getCurrentUserId();
  }

  async handOverMessages() {
    
    if (!this.currentUserId) return;
    const chatId = await this.chatService.getChatId(
      this.currentUserId,
      this.user.uid
    );
    if (!chatId) return; // kein Chat vorhanden

    this.chatService.getChatById(chatId).subscribe((chat) => {
      if (chat) {
        this.messageService.provideMessages(chat, 'chats');
      }
    });
  }
}
