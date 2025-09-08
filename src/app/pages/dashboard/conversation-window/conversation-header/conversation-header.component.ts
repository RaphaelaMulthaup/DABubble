import { Component, inject, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatActiveRouterService } from '../../../../services/chat-active-router.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../../services/user.service';
import { HeaderChannelComponent } from "./header-channel/header-channel.component";
import { HeaderSearchbarComponent } from './header-searchbar/header-searchbar.component';
import { HeaderChatComponent } from "./header-chat/header-chat.component";
import { MobileService } from '../../../../services/mobile.service';
import { MobileDashboardState } from '../../../../shared/types/mobile-dashboard-state.type';
import { HeaderThreadComponent } from './header-thread/header-thread.component';


@Component({
  selector: 'app-conversation-header',
  imports: [CommonModule, HeaderChannelComponent, HeaderSearchbarComponent, HeaderChatComponent, HeaderThreadComponent],
  templateUrl: './conversation-header.component.html',
  styleUrl: './conversation-header.component.scss',
})
export class ConversationHeaderComponent {
 mobileService = inject (MobileService)
  private userService = inject(UserService);
  mobileDashboardState: WritableSignal<MobileDashboardState> = this.mobileService.mobileDashboardState;

  conversationType!: string;
  conversationId!: string;
  messageToReplyId: string | null = null;

  private chatActiveRouterService = inject(ChatActiveRouterService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  ngOnInit() {
    this.chatActiveRouterService.getConversationType$(this.route).subscribe(t => {
      this.conversationType = t;
      //console.log(`aici trebuie tip  |  ${this.type} `);
    });
    this.chatActiveRouterService.getConversationId$(this.route).subscribe(id => {
      this.conversationId = id;
      //console.log(`aici channelid    | ${this.conversationId}`);
    });
    this.chatActiveRouterService.getMessageId$(this.route).subscribe(msgId => {
      this.messageToReplyId = msgId;
      //console.log(` aici messageid    |  ${this.messageToReplyId}`);
    });

  }

  redirectTo(conversationType: string, id: string) {
    this.router.navigate(['/dashboard', conversationType, id]);
  }

  // channelTyp!: string;
  // // channelData!: ChannelInterface;
  // //inject ActivatedRoute to get current url
  // private route = inject(ActivatedRoute);
  // private chatActiveRouterService = inject(ChatActiveRouterService);
  // // ngOnInit() {
  // //   this.chatActiveRouterService
  // //     .getParams$(this.route)
  // //     .pipe(
  // //       switchMap(({ type, id }) => this.chatActiveRouterService.getChannelInfo(type, id))
  // //     );
  // // }
  // onChange() {
  //   this.chatActiveRouterService.getConversationType$(this.route).subscribe((type) => {
  //     this.channelTyp = type;
  //     console.log('type:', type);
  //   });

}
