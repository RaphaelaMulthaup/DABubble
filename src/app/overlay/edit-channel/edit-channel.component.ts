import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../services/overlay.service';
import { ChannelInterface } from '../../shared/models/channel.interface';
import { Observable, of, switchMap } from 'rxjs';
import { ChangeChannelNameComponent } from "./change-channel-name/change-channel-name.component";
import { ChangeChannelDescriptionComponent } from "./change-channel-description/change-channel-description.component";
import { ChannelMembersComponent } from "./channel-members/channel-members.component";

@Component({
  selector: 'app-edit-channel',
  imports: [CommonModule, ChangeChannelNameComponent, ChangeChannelDescriptionComponent, ChannelMembersComponent],
  templateUrl: './edit-channel.component.html',
  styleUrl: './edit-channel.component.scss'
})
export class EditChannelComponent {
 

  channelId?:string;
  memberIds?:string[];

  private overlayService = inject(OverlayService);
  channelDetails$: Observable<ChannelInterface | undefined> = this.overlayService.overlayInput.pipe(
    switchMap(overlayData => overlayData?.channel ?? of(undefined))
  );


  ngOnInit(){
    this.channelDetails$.subscribe(channel => {
      if (channel) {
        this.channelId = channel.id;
        this.memberIds = channel.memberIds;
      }
    });
  }  

  closeOverlay() {
    this.overlayService.close();
  }
}
