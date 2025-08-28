import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConversationHeaderComponent } from './conversation-header/conversation-header.component';
import { WindowDisplayComponent } from './window-display/window-display.component';
import { CurrentPostInput } from './current-post-input/current-post-input.component';
import { Observable } from 'rxjs';
import { MessageInterface } from '../../../shared/models/message.interface';
import { MobileDashboardState } from '../../../shared/mobile-dashboard-state.type';

@Component({
  selector: 'app-conversation-window',
  imports: [ConversationHeaderComponent, WindowDisplayComponent, CurrentPostInput],
  templateUrl: './conversation-window.component.html',
  styleUrl: './conversation-window.component.scss'
})
export class ConversationWindowComponent {
@Input() data$!:Observable<MessageInterface[]>
@Output() changeMobileDashboardState = new EventEmitter<MobileDashboardState>();

ngOnInit(){
    this.data$.subscribe(messages => {
    //console.log('here are data from conversation-windows', messages);
  });
}
}
