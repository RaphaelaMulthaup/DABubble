import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from '../../../../services/message.service';
import { DisplayedMessageComponent } from './displayed-message/displayed-message.component';
import { MessageInterface } from '../../../../shared/models/message.interface';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, switchMap } from 'rxjs';
import { ChatActiveRouterService } from '../../../../services/chat-active-router.service';
import { tap } from 'rxjs';

@Component({
  selector: 'app-window-display', // Component selector used in parent templates
  imports: [DisplayedMessageComponent, CommonModule], // Imports child component to display individual messages
  templateUrl: './window-display.component.html', // External HTML template
  styleUrl: './window-display.component.scss', // SCSS styles for this component
})
export class WindowDisplayComponent {
  // Inject MessageService to receive and manage displayed messages
  messageService = inject(MessageService);

  //hier is a stream of messages
  messages$!: Observable<MessageInterface[]>;
  private route = inject(ActivatedRoute);
  private chatService = inject(ChatActiveRouterService);

  /**
   * Subscribe to the BehaviorSubject from MessageService
   * Keeps 'messages' updated with the latest conversation in real-time
   * sorts the messages chronologically
   */
  ngOnInit() {
    this.messages$ = this.chatService.getParams$(this.route).pipe(
      tap((params) => console.log('PARAMS from service:', params)),
      switchMap(({ type, id }) =>
        this.chatService
          .getMessages(type, id)
          .pipe(
            map((msgs) => [...msgs].sort((a, b) => a.createdAt - b.createdAt))
          )
      )
    );
  }
}
