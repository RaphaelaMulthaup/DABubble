import { Component, Input } from '@angular/core';
import { ConversationHeaderComponent } from './conversation-header/conversation-header.component';
import { WindowDisplayComponent } from './window-display/window-display.component';
import { CurrentPostInput } from './current-post-input/current-post-input.component';
import { Observable } from 'rxjs';
import { MessageInterface } from '../../../shared/models/message.interface';

@Component({
  selector: 'app-conversation-window',
  imports: [ConversationHeaderComponent, WindowDisplayComponent, CurrentPostInput],
  templateUrl: './conversation-window.component.html',
  styleUrl: './conversation-window.component.scss'
})
export class ConversationWindowComponent {
@Input() data$!:Observable<MessageInterface[]>

ngOnInit(){
    this.data$.subscribe(messages => {
    //console.log('here are data from conversation-windows', messages);
  });
}
}
