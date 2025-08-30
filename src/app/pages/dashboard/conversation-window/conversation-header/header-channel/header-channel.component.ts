import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../../../../services/overlay.service';
import { EditChannelComponent } from '../../../../../overlay/edit-channel/edit-channel.component';
import { ChatActiveRouterService } from '../../../../../services/chat-active-router.service';
import { ActivatedRoute } from '@angular/router';
import { ChannelInterface } from '../../../../../shared/models/channel.interface';
import { Observable, switchMap } from 'rxjs';
import { ChannelsService } from '../../../../../services/channels.service';


@Component({
  selector: 'app-header-channel',
  imports: [CommonModule],
  templateUrl: './header-channel.component.html',
  styleUrl: './header-channel.component.scss'
})
export class HeaderChannelComponent {
  channelId!:string;
  channelDetails$!: Observable<ChannelInterface | undefined>;

  private overlayService = inject(OverlayService);
  private chatActiveRouterService = inject(ChatActiveRouterService);
  private route = inject(ActivatedRoute);
  private channelService = inject(ChannelsService);



  ngOnInit(){
    this.channelDetails$ = this.chatActiveRouterService.getId$(this.route).pipe(
      switchMap(id => {
        this.channelId = id;
        return this.channelService.getCurrentChannel(this.channelId);
      })
    );
  }

  openEditChannelOverlay(event: MouseEvent){
    const origin = event.currentTarget as HTMLElement;
    this.overlayService.openComponent(origin, EditChannelComponent, true);
    this.overlayService.setOverlayInputs({channel: this.channelDetails$})
    // this.overlayService.close();
  }

  displayCreateChannelForm(channelName:string) {
    this.overlayService.displayOverlay(
      EditChannelComponent,
      `${channelName}`,
      this.channelDetails$
    );
  }
}

