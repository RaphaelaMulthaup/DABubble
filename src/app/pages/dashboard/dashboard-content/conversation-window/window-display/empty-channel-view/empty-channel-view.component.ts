import { Component, OnInit } from '@angular/core';
import { ChannelInterface } from '../../../../../../shared/models/channel.interface';
import { filter, Observable, Subject, takeUntil } from 'rxjs';
import { ConversationActiveRouterService } from '../../../../../../services/conversation-active-router.service';
import { ActivatedRoute } from '@angular/router';
import { ChannelsService } from '../../../../../../services/channels.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-channel-view',
  imports: [CommonModule],
  templateUrl: './empty-channel-view.component.html',
  styleUrl: './empty-channel-view.component.scss',
})
export class EmptyChannelViewComponent implements OnInit {
  private destroy$ = new Subject<void>();
  channel$!: Observable<ChannelInterface>;
  channelId!: string;

  constructor(
    private channelService: ChannelsService,
    private conversationActiveRouterService: ConversationActiveRouterService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.conversationActiveRouterService
      .getConversationId$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe((channelId: string) => {
        if (!channelId) return;
        this.channelId = channelId;
        this.channel$ = this.channelService
          .getCurrentChannel(channelId, true)
          .pipe(
            filter((channel): channel is ChannelInterface => channel !== undefined)
          );
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
