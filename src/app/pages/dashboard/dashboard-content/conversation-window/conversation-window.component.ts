import {
  Component,
  EventEmitter,
  Input,
  Output,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConversationHeaderComponent } from './conversation-header/conversation-header.component';
import { WindowDisplayComponent } from './window-display/window-display.component';
import { CurrentPostInput } from './current-post-input/current-post-input.component';
import { Observable } from 'rxjs';
import { PostInterface } from '../../../../shared/models/post.interface';
import { DashboardState } from '../../../../shared/types/dashboard-state.type';
import { ScreenSize } from '../../../../shared/types/screen-size.type';
import { ScreenService } from '../../../../services/screen.service';

@Component({
  selector: 'app-conversation-window',
  imports: [
    CommonModule,
    ConversationHeaderComponent,
    WindowDisplayComponent,
    CurrentPostInput,
  ],
  templateUrl: './conversation-window.component.html',
  styleUrl: './conversation-window.component.scss',
})
export class ConversationWindowComponent {
  @Input() data$?: Observable<PostInterface[]>;
  @Input() conversationWindowState?: 'conversation' | 'thread';
  @Output() changeDashboardState = new EventEmitter<DashboardState>();
  
  dashboardState!: WritableSignal<DashboardState>;
  screenSize$!: Observable<ScreenSize>;

  constructor(public screenService: ScreenService) {
    this.dashboardState = this.screenService.dashboardState;
    this.screenSize$ = this.screenService.screenSize$;
  }
}
