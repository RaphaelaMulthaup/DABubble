import { Component, inject, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatActiveRouterService } from '../../../../services/chat-active-router.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderChannelComponent } from './header-channel/header-channel.component';
import { HeaderSearchbarComponent } from './header-searchbar/header-searchbar.component';
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
  mobileDashboardState: WritableSignal<MobileDashboardState>;
  conversationType!: string;
  conversationId!: string;
  messageToReplyId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private mobileService: MobileService,
    private route: ActivatedRoute,
    private router: Router,
    private chatActiveRouterService: ChatActiveRouterService
  ) {
    this.mobileDashboardState = this.mobileService.mobileDashboardState;
  }

  ngOnInit() {
    this.chatActiveRouterService
      .getConversationType$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe((t) => {
        this.conversationType = t;
        //console.log(`aici trebuie tip  |  ${this.type} `);
      });
    this.chatActiveRouterService
      .getConversationId$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => {
        this.conversationId = id;
        //console.log(`aici channelid    | ${this.conversationId}`);
      });
    this.chatActiveRouterService
      .getMessageId$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe((msgId) => {
        this.messageToReplyId = msgId;
        //console.log(` aici messageid    |  ${this.messageToReplyId}`);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  redirectTo(conversationType: string, id: string) {
    this.router.navigate(['/dashboard', conversationType, id]);
  }
}
