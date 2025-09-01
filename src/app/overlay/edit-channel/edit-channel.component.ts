import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../services/overlay.service';
import { ChannelInterface } from '../../shared/models/channel.interface';
import { Observable, of, switchMap } from 'rxjs';
import { ChangeChannelNameComponent } from "./change-channel-name/change-channel-name.component";
import { ChangeChannelDescriptionComponent } from "./change-channel-description/change-channel-description.component";
import { ChannelMembersComponent } from "../../shared/components/channel-members/channel-members.component";
import { UserService } from '../../services/user.service';
import { ChatInterface } from '../../shared/models/chat.interface';
import { UserInterface } from '../../shared/models/user.interface';
import { AuthService } from '../../services/auth.service';
import { ChannelsService } from '../../services/channels.service';

@Component({
  selector: 'app-edit-channel',
  imports: [CommonModule, ChangeChannelNameComponent, ChangeChannelDescriptionComponent, ChannelMembersComponent],
  templateUrl: './edit-channel.component.html',
  styleUrl: './edit-channel.component.scss'
})
export class EditChannelComponent {
 
  private userService = inject(UserService);
  private authService = inject(AuthService);
   channelService = inject(ChannelsService);


  currentUser = this.authService.getCurrentUserId();

  channelId?:string;
  memberIds?:string[];
  createdById?:string;
  user$?:Observable<UserInterface>;


  public overlayService = inject(OverlayService);
  channelDetails$: Observable<ChannelInterface | undefined> = this.overlayService.overlayInput.pipe(
    switchMap(overlayData => overlayData?.channel ?? of(undefined))
  );

  constructor(){
  }

  ngOnInit(){
    this.channelDetails$.subscribe(channel => {
      if (channel) {
        this.createdById = channel.createdBy;
        this.channelId = channel.id;
        this.memberIds = channel.memberIds;
        this.user$ = this.userService.getUserById(this.createdById);
        console.log(this.currentUser);
        console.log(this.createdById);
      }
    });


    console.log(this.createdById);
  }  

  closeOverlay() {
    this.overlayService.close();
  }


}
