import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../../../../services/overlay.service';
import { EditChannelComponent } from '../../../../../overlay/edit-channel/edit-channel.component';
import { ConversationActiveRouterService } from '../../../../../services/conversation-active-router.service';
import { ActivatedRoute } from '@angular/router';
import { ChannelInterface } from '../../../../../shared/models/channel.interface';
import { Observable, switchMap } from 'rxjs';
import { ChannelsService } from '../../../../../services/channels.service';
import { ChannelMembersLengthComponent } from './channel-members-length/channel-members-length.component';
import { ChannelMembersComponent } from '../../../../../shared/components/channel-members/channel-members.component';
import { AddMemberToChannelComponent } from '../../../../../overlay/add-member-to-channel/add-member-to-channel.component';
import { MobileService } from '../../../../../services/mobile.service';
import { ChannelListItemComponent } from '../../../../../shared/components/channel-list-item/channel-list-item.component';
import { ScreenService } from '../../../../../services/screen.service';
import { ScreenSize } from '../../../../../shared/types/screen-size.type';

@Component({
  selector: 'app-header-channel',
  imports: [
    CommonModule,
    ChannelMembersLengthComponent,
    ChannelListItemComponent,
  ],
  templateUrl: './header-channel.component.html',
  styleUrl: './header-channel.component.scss',
})
export class HeaderChannelComponent {
  channelId!: string;
  channelDetails$!: Observable<ChannelInterface | undefined>;
  memberIds?: string[];
  screenSize$!: Observable<ScreenSize>;

  constructor(
    private overlayService: OverlayService,
    private conversationActiveRouterService: ConversationActiveRouterService,
    private route: ActivatedRoute,
    private channelService: ChannelsService,
    private mobileService: MobileService,
    private screenService: ScreenService
  ) {
    this.screenSize$ = this.screenService.screenSize$;
  }

  ngOnInit() {
    this.channelDetails$ = this.conversationActiveRouterService
      .getConversationId$(this.route)
      .pipe(
        switchMap((id) => {
          this.channelId = id;
          return this.channelService.getCurrentChannel(this.channelId);
        })
      );
  }

  ngOnDestroy() {}

  openEditChannelFormOverlay(event: MouseEvent) {
    this.overlayService.openComponent(
      EditChannelComponent,
      'cdk-overlay-dark-backdrop',
      {
        origin: event.currentTarget as HTMLElement,
        originPosition: {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
        },
      },

      { channelDetails$: this.channelDetails$ as Observable<ChannelInterface> }
    );
  }

  openChannelMembers(event: MouseEvent) {
    this.overlayService.openComponent(
      ChannelMembersComponent,
      'cdk-overlay-transparent-backdrop',
      {
        origin: event.currentTarget as HTMLElement,
        originPosition: {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
        },
      },
      {
        channelDetails$: this.channelDetails$ as Observable<ChannelInterface>,
        overlay: 'overlay-right',
        clickedFromHeader: true,
      }
    );
  }

  openAddMembersToChannel(event: MouseEvent) {
    this.overlayService.openComponent(
      AddMemberToChannelComponent,
      'cdk-overlay-transparent-backdrop',
      {
        origin: event.currentTarget as HTMLElement,
        originPosition: {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
        },
      },
      {
        channelDetails$: this.channelDetails$ as Observable<ChannelInterface>,
        overlay: 'overlay-right',
      }
    );
  }
}
