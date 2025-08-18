import { Component, inject } from '@angular/core';
import { MessageService } from '../../../../services/message.service';
import { DisplayedMessageComponent } from './displayed-message/displayed-message.component';
import { MessageInterface } from '../../../../shared/models/message.interface';

@Component({
  selector: 'app-window-display',
  imports: [DisplayedMessageComponent],
  templateUrl: './window-display.component.html',
  styleUrl: './window-display.component.scss',
})
export class WindowDisplayComponent {
  messageService = inject(MessageService);
  messages: MessageInterface[] = [];
  ngOnInit() {
        console.log('Window Displayed');
    this.messageService.messagesDisplayedConversation$.subscribe((msgs) => {
      this.messages = msgs; // immer aktuell
    });
    // console.log('messages', this.messages);
    
  }
}
