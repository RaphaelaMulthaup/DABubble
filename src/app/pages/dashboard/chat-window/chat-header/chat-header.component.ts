import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatActiveRouterService } from '../../../../services/chat-active-router.service';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-chat-header',
  imports: [CommonModule],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss',
})
export class ChatHeaderComponent {

  type!: string;
  conversationId!: string;
  replyToMessageId: string | null = null;

  private chatService = inject(ChatActiveRouterService);
  private route = inject(ActivatedRoute);
  private router =inject(Router);
    ngOnInit() {
    this.chatService.getType$(this.route).subscribe(t => {
      this.type = t;
          console.log(`aici trebuie tip  |  ${this.type } `);
    });
    this.chatService.getId$(this.route).subscribe(id => {
      this.conversationId = id;
          console.log(`aici channelid    | ${this.conversationId}`);
    });
    this.chatService.getMessageId$(this.route).subscribe(msgId => {
      this.replyToMessageId = msgId; 
          console.log(` aici messageid    |  ${this.replyToMessageId}`);
    });
  }

  redirectTo(type:string, id:string){
        this.router.navigate(['/dashboard', type, id]);
  }
}
