import { Component } from '@angular/core';
import { ChannelInterface } from '../../../../../shared/models/channel.interface';
import { filter, Observable, take } from 'rxjs';
import { ChatActiveRouterService } from '../../../../../services/chat-active-router.service';
import { ActivatedRoute } from '@angular/router';
import { ChannelsService } from '../../../../../services/channels.service';
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

  constructor(
    private chatActiveRouterService: ChatActiveRouterService, // Service for reading chat/channel routing info
    private route: ActivatedRoute, // Gives access to the current route (params, query, etc.)
    private channelService: ChannelsService // Provides methods to fetch channel data
  ) {}

  /**
   * Lifecycle hook: initializes the component.
   * - Reads the channelId once from the route via ChatActiveRouterService
   * - Fetches the current channel from ChannelsService
   * - Ensures that `channel$` only emits when a valid channel exists
   */
  ngOnInit() {
    this.chatActiveRouterService
      .getConversationId$(this.route)
      .pipe(take(1)) // take only the first emitted value
      .subscribe((channelId: string) => {
        this.channelId = channelId;

        // Fetch the channel based on channelId, ignore undefined results
        this.channel$ = this.channelService
          .getCurrentChannel(channelId)
          .pipe(
            filter(
              (channel): channel is ChannelInterface => channel !== undefined
            )
          );
      });
  }
}
