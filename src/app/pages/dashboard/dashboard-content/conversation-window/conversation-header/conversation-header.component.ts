import { Component, Input, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConversationActiveRouterService } from '../../../../../services/conversation-active-router.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderChannelComponent } from './header-channel/header-channel.component';
import { HeaderSearchbarComponent } from '../../../dashboard-content/header-searchbar/header-searchbar.component';
import { HeaderChatComponent } from './header-chat/header-chat.component';
import { DashboardState } from '../../../../../shared/types/dashboard-state.type';
import { HeaderThreadComponent } from './header-thread/header-thread.component';
import { combineLatest, Observable, Subject, takeUntil } from 'rxjs';
import { ScreenSize } from '../../../../../shared/types/screen-size.type';
import { ScreenService } from '../../../../../services/screen.service';

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
  @Input() conversationWindowState?: 'conversation' | 'thread';
  dashboardState: WritableSignal<DashboardState>;
  screenSize$!: Observable<ScreenSize>;
  destroy$ = new Subject<void>();
  messageToReplyId: string | null = null;
  conversationType!: string;
  conversationId!: string;

  constructor(
    private conversationActiveRouterService: ConversationActiveRouterService,
    private route: ActivatedRoute,
    private router: Router,
    public screenService: ScreenService
  ) {
    this.dashboardState = this.screenService.dashboardState;
    this.screenSize$ = this.screenService.screenSize$;
  }

  ngOnInit() {
    combineLatest([
      this.conversationActiveRouterService.getConversationType$(this.route),
      this.conversationActiveRouterService.getConversationId$(this.route),
      this.conversationActiveRouterService.getMessageId$(this.route),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([type, id, msgId]) => {
        this.conversationType = type;
        this.conversationId = id;
        this.messageToReplyId = msgId;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Redirects the user to a specific conversation based on the conversation type and ID.
   *
   * @param conversationType - Type of the conversation (e.g., 'chat', 'channel')
   * @param id - ID of the conversation to redirect to
   */
  redirectTo(conversationType: string, id: string) {
    this.router.navigate(['/dashboard', conversationType, id]);
  }
}
