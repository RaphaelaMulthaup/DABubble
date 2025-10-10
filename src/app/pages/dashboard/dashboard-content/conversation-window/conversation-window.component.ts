import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConversationHeaderComponent } from './conversation-header/conversation-header.component';
import { WindowDisplayComponent } from './window-display/window-display.component';
import { CurrentPostInput } from './current-post-input/current-post-input.component';
import { distinctUntilChanged, map, Observable, take } from 'rxjs';
import { PostInterface } from '../../../../shared/models/post.interface';
import { DashboardState } from '../../../../shared/types/dashboard-state.type';
import { ScreenSize } from '../../../../shared/types/screen-size.type';
import { ScreenService } from '../../../../services/screen.service';
import { ActivatedRoute } from '@angular/router';
import { ConversationActiveRouterService } from '../../../../services/conversation-active-router.service';

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
  @Output() changeDashboardState = new EventEmitter<DashboardState>();

  /**
   * WritableSignal representing the mobile dashboard state.
   * The state can be modified and communicated to other parts of the app.
   */
  dashboardState!: WritableSignal<DashboardState>;
  screenSize$!: Observable<ScreenSize>;
  @Input() conversationWindowState?: 'conversation' | 'thread';

  constructor(
    private conversationActiveRouterService: ConversationActiveRouterService,
    private route: ActivatedRoute,
    public screenService: ScreenService
  ) {
    this.dashboardState = this.screenService.dashboardState;
    this.screenSize$ = this.screenService.screenSize$;

    // let screenSize;
    // this.screenSize$.pipe((take(1))).subscribe((size) => screenSize = size);
    // if (screenSize === 'web' && this.dashboardState() === 'thread-window') {
    //   this.conversationWindowState = 'thread';
    //   this.data$ = this.conversationActiveRouterService.threadMessages$;
    //   this.data$.pipe(take(1)).subscribe((m) => console.log(m));
    // }
  }
}
