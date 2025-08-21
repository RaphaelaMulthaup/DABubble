import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ChatActiveRouterService } from '../../../../services/chat-active-router.service';
import { switchMap, tap } from 'rxjs';
import { ChannelInterface } from '../../../../shared/models/channel.interface';

@Component({
  selector: 'app-chat-header',
  imports: [CommonModule],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss',
})
export class ChatHeaderComponent {
  channelData!: ChannelInterface;
  private route = inject(ActivatedRoute);
  private chatService = inject(ChatActiveRouterService);

  ngOnInit() {
    this.chatService
      .getParams$(this.route)
      .pipe(
        switchMap(({ type, id }) => this.chatService.getChannelInfo(type, id))
      );
  }
}
