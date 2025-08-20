import { Component, inject } from '@angular/core';
import { MessageService } from '../../../../services/message.service';
import { DisplayedMessageComponent } from './displayed-message/displayed-message.component';
import { MessageInterface } from '../../../../shared/models/message.interface';

@Component({
  selector: 'app-window-display', // Component selector used in parent templates
  imports: [DisplayedMessageComponent], // Imports child component to display individual messages
  templateUrl: './window-display.component.html', // External HTML template
  styleUrl: './window-display.component.scss', // SCSS styles for this component
})
export class WindowDisplayComponent {
  // Inject MessageService to receive and manage displayed messages
  messageService = inject(MessageService);

  // Local array to hold the current list of messages
  messages: MessageInterface[] = [];

  /**
   * Subscribe to the BehaviorSubject from MessageService
   * Keeps 'messages' updated with the latest conversation in real-time
   */
  ngOnInit() {
    this.messageService.messagesDisplayedConversation$.subscribe((msgs) => {
      this.messages = [...msgs].sort((a, b) => a.createdAt - b.createdAt);
    });
  }
}
