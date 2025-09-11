import { Component } from '@angular/core';
import { UserListItemComponent } from '../../../../../shared/components/user-list-item/user-list-item.component';
import { Observable } from 'rxjs';
import { ChatService } from '../../../../../services/chat.service';
import { UserInterface } from '../../../../../shared/models/user.interface';
import { CommonModule } from '@angular/common';

/**
 * The HeaderChatComponent displays the user information of the other participant
 * in the current chat, using the UserListItemComponent to show the other user's data.
 */
@Component({
  selector: 'app-header-chat', // The selector used in the HTML template to render this component
  // Importing necessary child component for displaying user details and the CommonModule
  imports: [UserListItemComponent, CommonModule],
  templateUrl: './header-chat.component.html', // Path to the HTML template
  styleUrl: './header-chat.component.scss', // Path to the styling file
})
export class HeaderChatComponent {
  /**
   * Observable representing the other user in the current chat.
   * The value is fetched from the ChatService.
   */
  otherUser$!: Observable<UserInterface | null>;

  /**
   * Constructor that injects the ChatService to access chat-related data and logic.
   */
  constructor(private chatService: ChatService) {}

  /**
   * Lifecycle hook called when the component is initialized.
   * Subscribes to the `otherUser$` observable from ChatService to get the details of the other user in the chat.
   */
  ngOnInit(): void {
    // Assigning the observable from ChatService to `otherUser$`
    this.otherUser$ = this.chatService.otherUser$;
  }
}
