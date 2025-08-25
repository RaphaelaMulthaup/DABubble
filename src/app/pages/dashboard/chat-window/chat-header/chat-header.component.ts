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
  channelTyp!: string;
  // channelData!: ChannelInterface;
  //inject ActivatedRoute to get current url
  private route = inject(ActivatedRoute);
  private chatActiveRouterService = inject(ChatActiveRouterService);
  // ngOnInit() {
  //   this.chatActiveRouterService
  //     .getParams$(this.route)
  //     .pipe(
  //       switchMap(({ type, id }) => this.chatActiveRouterService.getChannelInfo(type, id))
  //     );
  // }
  onChange() {
    this.chatActiveRouterService.getType$(this.route).subscribe((type) => {
      this.channelTyp = type;
      console.log('type:', type);
    });
  }
}
