import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConversationHeaderComponent } from './conversation-header/conversation-header.component';
import { WindowDisplayComponent } from './window-display/window-display.component';
import { CurrentPostInput } from './current-post-input/current-post-input.component';
import { Observable } from 'rxjs';
import { PostInterface } from '../../../shared/models/post.interface';
import { MobileDashboardState } from '../../../shared/types/mobile-dashboard-state.type';
import { MobileService } from '../../../services/mobile.service';
import { ScreenSize } from '../../../shared/types/screen-size.type';
import { ScreenService } from '../../../services/screen.service';

/**
 * Component representing a conversation window.
 * This component is responsible for displaying the conversation header, messages, and post input field.
 * It also manages the state of the mobile dashboard, communicating with the `MobileService`.
 */
@Component({
  selector: 'app-conversation-window', // The component selector for use in HTML
  imports: [
    CommonModule,
    ConversationHeaderComponent, // Child component to display conversation header
    WindowDisplayComponent, // Child component to display messages
    CurrentPostInput, // Child component to handle user input for new posts
  ],
  templateUrl: './conversation-window.component.html', // Path to the component's HTML template
  styleUrl: './conversation-window.component.scss', // Path to the component's stylesheet
})
export class ConversationWindowComponent {
  /**
   * Observable representing the list of posts in the conversation.
   * This is an input property, which means the parent component can pass an Observable of `PostInterface[]` into this component.
   */
  @Input() data$?: Observable<PostInterface[]>;

  /**
   * EventEmitter that emits the change in mobile dashboard state.
   * The parent component can listen to this event to track changes in the state.
   */
  @Output() changeMobileDashboardState =
    new EventEmitter<MobileDashboardState>();

  /**
   * Instance of `MobileService`, injected to access mobile dashboard state.
   */
  mobileService = inject(MobileService);

  /**
   * WritableSignal representing the mobile dashboard state.
   * The state can be modified and communicated to other parts of the app.
   */
  mobileDashboardState!: WritableSignal<MobileDashboardState>;
  screenSize$!: Observable<ScreenSize>;
  @Input() conversationWindowState?: 'conversation' | 'thread';

  constructor(public screenService: ScreenService) {
    this.mobileDashboardState = this.screenService.mobileDashboardState;
    this.screenSize$ = this.screenService.screenSize$;   
  }
}
