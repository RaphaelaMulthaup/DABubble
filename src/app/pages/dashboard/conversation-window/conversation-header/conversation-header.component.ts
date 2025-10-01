import { Component, Input, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConversationActiveRouterService } from '../../../../services/conversation-active-router.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderChannelComponent } from './header-channel/header-channel.component';
import { HeaderSearchbarComponent } from '../../header-searchbar/header-searchbar.component';
import { HeaderChatComponent } from './header-chat/header-chat.component';
import { DashboardState } from '../../../../shared/types/dashboard-state.type';
import { HeaderThreadComponent } from './header-thread/header-thread.component';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ScreenSize } from '../../../../shared/types/screen-size.type';
import { ScreenService } from '../../../../services/screen.service';

@Component({
  selector: 'app-conversation-header',
  imports: [
    CommonModule,
    HeaderChannelComponent,
    HeaderSearchbarComponent,
    HeaderChatComponent,
    HeaderThreadComponent,
  ],
  templateUrl: './conversation-header.component.html',
  styleUrl: './conversation-header.component.scss',
})
export class ConversationHeaderComponent {
  dashboardState: WritableSignal<DashboardState>; // Holds the state for mobile dashboard
  conversationType!: string; // Holds the type of conversation (e.g., chat, channel)
  conversationId!: string; // Holds the ID of the current conversation
  messageToReplyId: string | null = null; // Holds the ID of the message to reply to (if any)
  @Input() conversationWindowState?: 'conversation' | 'thread';
  screenSize$!: Observable<ScreenSize>;
  private destroy$ = new Subject<void>(); // Subject to handle unsubscribe logic on component destruction

  constructor(
    public screenService: ScreenService,
    private route: ActivatedRoute, // Angular route service to access route parameters
    private router: Router, // Angular router service to navigate between routes
    private conversationActiveRouterService: ConversationActiveRouterService // Custom service for handling active chat/router state
  ) {
    this.dashboardState = this.screenService.dashboardState; // Inject the mobile state from the service
    this.screenSize$ = this.screenService.screenSize$;
  }

  /**
   * ngOnInit lifecycle hook
   * Subscribes to the route parameters (conversation type, conversation ID, message ID) and updates the component state.
   */
  ngOnInit() {
    // Subscribe to the conversation type from the route and update the component's state
    this.conversationActiveRouterService
      .getConversationType$(this.route)
      .pipe(takeUntil(this.destroy$)) // Unsubscribe on component destroy
      .subscribe((t) => {
        this.conversationType = t; // Update the conversation type state
      });

    // Subscribe to the conversation ID from the route and update the component's state
    this.conversationActiveRouterService
      .getConversationId$(this.route)
      .pipe(takeUntil(this.destroy$)) // Unsubscribe on component destroy
      .subscribe((id) => {
        this.conversationId = id; // Update the conversation ID state
      });

    // Subscribe to the message ID from the route and update the component's state
    this.conversationActiveRouterService
      .getMessageId$(this.route)
      .pipe(takeUntil(this.destroy$)) // Unsubscribe on component destroy
      .subscribe((msgId) => {
        this.messageToReplyId = msgId; // Update the message reply ID state
      });
  }

  /**
   * ngOnDestroy lifecycle hook
   * Cleans up the subscriptions to prevent memory leaks.
   */
  ngOnDestroy() {
    this.destroy$.next(); // Notify all subscriptions to complete
    this.destroy$.complete(); // Complete the subject to clean up resources
  }

  /**
   * Redirects the user to a specific conversation based on the conversation type and ID
   * @param conversationType - Type of the conversation (e.g., 'chat', 'channel')
   * @param id - ID of the conversation to redirect to
   */
  redirectTo(conversationType: string, id: string) {
    this.router.navigate(['/dashboard', conversationType, id]); // Navigate to the specified conversation
  }
}
