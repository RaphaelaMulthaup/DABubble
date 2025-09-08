import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  WritableSignal,
} from '@angular/core';
import { ConversationHeaderComponent } from './conversation-header/conversation-header.component';
import { WindowDisplayComponent } from './window-display/window-display.component';
import { CurrentPostInput } from './current-post-input/current-post-input.component';
import { Observable } from 'rxjs';
import { PostInterface } from '../../../shared/models/post.interface';
import { MobileDashboardState } from '../../../shared/types/mobile-dashboard-state.type';
import { MobileService } from '../../../services/mobile.service';

@Component({
  selector: 'app-conversation-window',
  imports: [
    ConversationHeaderComponent,
    WindowDisplayComponent,
    CurrentPostInput,
  ],
  templateUrl: './conversation-window.component.html',
  styleUrl: './conversation-window.component.scss',
})
export class ConversationWindowComponent {
  @Input() data$!: Observable<PostInterface[]>;
  @Output() changeMobileDashboardState =
    new EventEmitter<MobileDashboardState>();
}
