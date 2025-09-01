import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelsService } from '../../../services/channels.service';
import { FormsModule } from '@angular/forms';
import { ChannelInterface } from '../../../shared/models/channel.interface';
import { Observable } from 'rxjs';
import { UserInterface } from '../../../shared/models/user.interface';

@Component({
  selector: 'app-change-channel-description',
  imports: [CommonModule,FormsModule],
  templateUrl: './change-channel-description.component.html',
  styleUrl: './change-channel-description.component.scss'
})
export class ChangeChannelDescriptionComponent {
@Input() channelId?:string;
@Input() user$?:Observable<UserInterface>;

@Input() channel?:ChannelInterface;

  isEditActive:boolean = false;
  descriptionInput?: string;

 
private channelService = inject(ChannelsService);

async saveDescription(newName: string) {
  this.channelService.changeChannelDescription(this.channelId!, newName);
  this.isEditActive = !this.isEditActive;
}

  toggleEdit() {
    this.isEditActive = !this.isEditActive;
    if (this.isEditActive && this.channel){
      this.descriptionInput = this.channel.description;
    }
  }
}
