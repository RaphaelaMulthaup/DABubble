import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../../../../services/overlay.service';
import { EditChannelComponent } from '../../../../../overlay/edit-channel/edit-channel.component';
import { ChatActiveRouterService } from '../../../../../services/chat-active-router.service';
import { ActivatedRoute } from '@angular/router';
import { ChannelInterface } from '../../../../../shared/models/channel.interface';
import { Observable, switchMap } from 'rxjs';
import { ChannelsService } from '../../../../../services/channels.service';
import { ChannelMembersLengthComponent } from './channel-members-length/channel-members-length.component';
import { ChannelMembersComponent } from '../../../../../shared/components/channel-members/channel-members.component';

@Component({
  selector: 'app-header-channel',
  imports: [CommonModule, ChannelMembersLengthComponent],
  templateUrl: './header-channel.component.html',
  styleUrl: './header-channel.component.scss',
})
export class HeaderChannelComponent {
  channelId!: string;
  channelDetails$!: Observable<ChannelInterface | undefined>;
  memberIds?: string[];

  private overlayService = inject(OverlayService);
  private chatActiveRouterService = inject(ChatActiveRouterService);
  private route = inject(ActivatedRoute);
  private channelService = inject(ChannelsService);

  ngOnInit() {
    this.channelDetails$ = this.chatActiveRouterService.getId$(this.route).pipe(
      switchMap((id) => {
        this.channelId = id;
        return this.channelService.getCurrentChannel(this.channelId);
      })
    );
  }

  openEditChannelFormOverlay() {
    this.overlayService.openComponent(
      EditChannelComponent,
      'cdk-overlay-dark-backdrop',
      { globalPosition: 'center' },
      { channelDetails$: this.channelDetails$ as Observable<ChannelInterface> }
    );
  }

  openChannelMembers(event: MouseEvent) {
    this.overlayService.openComponent(
      ChannelMembersComponent,
      'cdk-overlay-dark-backdrop',
      {
        origin: event.currentTarget as HTMLElement,
        originPosition: {
          originX: 'center',
          originY: 'bottom',
          overlayX: 'center',
          overlayY: 'top',
        },
        originPositionFallback: {
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom',
        },
      },
      { channelDetails$: this.channelDetails$ as Observable<ChannelInterface> }
    );
  }
}
