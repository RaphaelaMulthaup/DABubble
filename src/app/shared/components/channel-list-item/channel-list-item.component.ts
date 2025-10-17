import { Component, EventEmitter, Input, Output, WritableSignal } from '@angular/core';
import { ChannelInterface } from '../../models/channel.interface';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ScreenService } from '../../../services/screen.service';
import { ScreenSize } from '../../types/screen-size.type';
import { Observable } from 'rxjs';
import { ConversationActiveRouterService } from '../../../services/conversation-active-router.service';
import { DashboardState } from '../../types/dashboard-state.type';

@Component({
  selector: 'app-channel-list-item',
  imports: [RouterLink, CommonModule],
  templateUrl: './channel-list-item.component.html',
  styleUrls: [
    './channel-list-item.component.scss',
    './../../../shared/styles/list-item.scss',
  ],
})
export class ChannelListItemComponent {
  @Input() channel!: ChannelInterface;
  @Input() active: boolean = false;
  @Input() relatedToSearchResultPost: boolean = false;
  @Input() isInSearchResultsCurrentPostInput: boolean = false;
  @Input() isInChannelHeader = false;
  @Output() channelSelected = new EventEmitter<ChannelInterface>();

  dashboardState!: WritableSignal<DashboardState>;
  screenSize$!: Observable<ScreenSize>;
  channelId!: string;

  constructor(
    public conversationActiveRouterService: ConversationActiveRouterService,
    public screenService: ScreenService
  ) {
    this.dashboardState = this.screenService.dashboardState;
    this.screenSize$ = this.screenService.screenSize$;
  }

  /**
   * Emits the selected channel via the channelSelected EventEmitter.
   * This is used to notify the parent component of the selected channel.
   */
  emitChannel() {
    this.channelSelected.emit(this.channel);
  }
}
