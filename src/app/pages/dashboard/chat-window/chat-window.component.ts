import { Component, Input } from '@angular/core';
import { ChatHeaderComponent } from './chat-header/chat-header.component';
import { WindowDisplayComponent } from './window-display/window-display.component';
import { CurrentMessageInput } from './current-message-input/current-message-input.component';
import { Observable } from 'rxjs';
import { MessageInterface } from '../../../shared/models/message.interface';

@Component({
  selector: 'app-chat-window',
  imports: [ChatHeaderComponent, WindowDisplayComponent, CurrentMessageInput],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss'
})
export class ChatWindowComponent {
@Input() data$!:Observable<MessageInterface[]>

ngOnInit(){
    this.data$.subscribe(messages => {
    console.log('here are data from chat-windows', messages);
  });
}
}
