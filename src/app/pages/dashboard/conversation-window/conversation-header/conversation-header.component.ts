import { Component, inject, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatActiveRouterService } from '../../../../services/chat-active-router.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderChannelComponent } from './header-channel/header-channel.component';
import { HeaderSearchbarComponent } from '../../header-searchbar/header-searchbar.component';
import { HeaderChatComponent } from './header-chat/header-chat.component';
import { MobileService } from '../../../../services/mobile.service';
import { MobileDashboardState } from '../../../../shared/types/mobile-dashboard-state.type';
import { HeaderThreadComponent } from './header-thread/header-thread.component';
import { Subject, takeUntil } from 'rxjs';

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
  mobileDashboardState: WritableSignal<MobileDashboardState>; // Holds the state for mobile dashboard
  conversationType!: string; // Holds the type of conversation (e.g., chat, channel)
  conversationId!: string; // Holds the ID of the current conversation
  messageToReplyId: string | null = null; // Holds the ID of the message to reply to (if any)
  private destroy$ = new Subject<void>(); // Subject to handle unsubscribe logic on component destruction

  constructor(
    private mobileService: MobileService, // Service for managing mobile state
    private route: ActivatedRoute, // Angular route service to access route parameters
    private router: Router, // Angular router service to navigate between routes
    private chatActiveRouterService: ChatActiveRouterService // Custom service for handling active chat/router state
  ) {
    this.mobileDashboardState = this.mobileService.mobileDashboardState; // Inject the mobile state from the service
  }

  /**
   * ngOnInit lifecycle hook
   * Subscribes to the route parameters (conversation type, conversation ID, message ID) and updates the component state.
   */
  ngOnInit() {
    // Subscribe to the conversation type from the route and update the component's state
    this.chatActiveRouterService
      .getConversationType$(this.route)
      .pipe(takeUntil(this.destroy$)) // Unsubscribe on component destroy
      .subscribe((t) => {
        this.conversationType = t; // Update the conversation type state
        //console.log(`aici trebuie tip  |  ${this.type} `);
      });

    // Subscribe to the conversation ID from the route and update the component's state
    this.chatActiveRouterService
      .getConversationId$(this.route)
      .pipe(takeUntil(this.destroy$)) // Unsubscribe on component destroy
      .subscribe((id) => {
        this.conversationId = id; // Update the conversation ID state
        //console.log(`aici channelid    | ${this.conversationId}`);
      });

    // Subscribe to the message ID from the route and update the component's state
    this.chatActiveRouterService
      .getMessageId$(this.route)
      .pipe(takeUntil(this.destroy$)) // Unsubscribe on component destroy
      .subscribe((msgId) => {
        this.messageToReplyId = msgId; // Update the message reply ID state
        //console.log(` aici messageid    |  ${this.messageToReplyId}`);
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
