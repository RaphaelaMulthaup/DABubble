import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatActiveRouterService } from '../../../../services/chat-active-router.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../../services/user.service';


@Component({
  selector: 'app-conversation-header',
  imports: [CommonModule],
  templateUrl: './conversation-header.component.html',
  styleUrl: './conversation-header.component.scss',
})
export class ConversationHeaderComponent {

  private userService = inject(UserService);

  type!: string;
  conversationId!: string;
  messageToReplyId: string | null = null;

  private chatActiveRouterService = inject(ChatActiveRouterService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  ngOnInit() {
    this.chatActiveRouterService.getType$(this.route).subscribe(t => {
      this.type = t;
      //console.log(`aici trebuie tip  |  ${this.type} `);
    });
    this.chatActiveRouterService.getId$(this.route).subscribe(id => {
      this.conversationId = id;
      //console.log(`aici channelid    | ${this.conversationId}`);
    });
    this.chatActiveRouterService.getMessageId$(this.route).subscribe(msgId => {
      this.messageToReplyId = msgId;
      //console.log(` aici messageid    |  ${this.messageToReplyId}`);
    });

  }

  redirectTo(type: string, id: string) {
    this.router.navigate(['/dashboard', type, id]);
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
  //   this.chatActiveRouterService.getType$(this.route).subscribe((type) => {
  //     this.channelTyp = type;
  //     console.log('type:', type);
  //   });

}
