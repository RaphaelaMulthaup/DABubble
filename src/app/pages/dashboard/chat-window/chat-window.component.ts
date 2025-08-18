import { Component } from '@angular/core';
import { ChatHeaderComponent } from './chat-header/chat-header.component';
import { WindowDisplayComponent } from './window-display/window-display.component';
import { CurrentMessageInput } from './current-message-input/current-message-input.component';

@Component({
  selector: 'app-chat-window',
  imports: [ChatHeaderComponent, WindowDisplayComponent, CurrentMessageInput],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss'
})
export class ChatWindowComponent {

}
