import { Component } from '@angular/core';
import { ChannelInterface } from '../../../../../../shared/models/channel.interface';
import { filter, Observable, Subject, take, takeUntil } from 'rxjs';
import { ConversationActiveRouterService } from '../../../../../../services/conversation-active-router.service';
import { ActivatedRoute } from '@angular/router';
import { ChannelsService } from '../../../../../../services/channels.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-channel-view', // Component selector for usage in templates
  imports: [CommonModule], // Common Angular directives (ngIf, ngFor, etc.)
  templateUrl: './empty-channel-view.component.html', // External HTML template
  styleUrl: './empty-channel-view.component.scss', // External SCSS file
})
export class EmptyChannelViewComponent {
  // Observable stream of the current channel
  channel$!: Observable<ChannelInterface>;

  // The current channel ID resolved from the route
  channelId!: string;
  private destroy$ = new Subject<void>();

  constructor(
    private conversationActiveRouterService: ConversationActiveRouterService, // Service for reading chat/channel routing info
    private route: ActivatedRoute, // Gives access to the current route (params, query, etc.)
    private channelService: ChannelsService // Provides methods to fetch channel data
  ) {
    console.log(1)
  }

  /**
   * Lifecycle hook: initializes the component.
   * - Reads the channelId once from the route via ConversationActiveRouterService
   * - Fetches the current channel from ChannelsService
   * - Ensures that `channel$` only emits when a valid channel exists
   */
  ngOnChanges() {
    this.conversationActiveRouterService
      .getConversationId$(this.route)
      .pipe(takeUntil(this.destroy$)) // reagiert dauerhaft auf Änderungen
      .subscribe((channelId: string) => {
        if (!channelId) return;

        this.channelId = channelId;

        this.channel$ = this.channelService
          .getCurrentChannel(channelId)
          .pipe(
            filter(
              (channel): channel is ChannelInterface => channel !== undefined
            )
          );
      });

    // this.channel$.subscribe((m) => console.log(m));
    // console.log(this.channelId);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
