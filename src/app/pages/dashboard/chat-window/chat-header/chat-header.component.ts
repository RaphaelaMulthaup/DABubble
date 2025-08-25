import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatActiveRouterService } from '../../../../services/chat-active-router.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../../services/user.service';
import { SearchBarHeaderComponent } from "./search-bar-header/search-bar-header.component";


@Component({
  selector: 'app-chat-header',
  imports: [CommonModule, SearchBarHeaderComponent],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss',
})
export class ChatHeaderComponent {

  private userService = inject(UserService);

  type!: string;
  conversationId!: string;
  messageToReplyId: string | null = null;

  private chatService = inject(ChatActiveRouterService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  ngOnInit() {
    this.chatService.getType$(this.route).subscribe(t => {
      this.type = t;
      console.log(`aici trebuie tip  |  ${this.type} `);
    });
    this.chatService.getId$(this.route).subscribe(id => {
      this.conversationId = id;
      console.log(`aici channelid    | ${this.conversationId}`);
    });
    this.chatService.getMessageId$(this.route).subscribe(msgId => {
      this.messageToReplyId = msgId;
      console.log(` aici messageid    |  ${this.messageToReplyId}`);
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
