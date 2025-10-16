import { Component, WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';
import { ChannelInterface } from '../../../../shared/models/channel.interface';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../../../services/auth.service';
import { CreateChannelFormComponent } from '../../../../overlay/create-channel-form/create-channel-form.component';
import { OverlayService } from '../../../../services/overlay.service';
import { ChannelListItemComponent } from '../../../../shared/components/channel-list-item/channel-list-item.component';
import { DashboardState } from '../../../../shared/types/dashboard-state.type';
import { SearchService } from '../../../../services/search.service';
import { ScreenService } from '../../../../services/screen.service';
import { ConversationActiveRouterService } from '../../../../services/conversation-active-router.service';

@Component({
  selector: 'app-channel-list',
  imports: [AsyncPipe, ChannelListItemComponent],
  templateUrl: './channel-list.component.html',
  styleUrl: './channel-list.component.scss',
})
export class ChannelListComponent {
  dashboardState: WritableSignal<DashboardState>;
  channels$!: Observable<ChannelInterface[]>;

  selectedChannel: ChannelInterface | null = null;
  channelsVisible: boolean = true;
  showPopup: boolean = false;
  currentUserId!: string | null;

  constructor(
    private authService: AuthService,
    public conversationActiveRouterService: ConversationActiveRouterService,
    private overlayService: OverlayService,
    public screenService: ScreenService,
    private searchService: SearchService
  ) {
    this.channels$ = this.searchService.getUserChannels$();
    this.currentUserId = this.authService.getCurrentUserId();
    this.dashboardState = this.screenService.dashboardState;
  }

  /**
   * This function opens the CreateChannelForm-Overlay.
   */
  openCreateChannelFormOverlay() {
    this.overlayService.openComponent(
      CreateChannelFormComponent,
      'cdk-overlay-dark-backdrop',
      { globalPosition: 'center' }
    );
  }
}
