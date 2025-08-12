import { Component, inject } from '@angular/core';
import { ChannelsService } from '../../../services/channels.service';
import { Observable } from 'rxjs';
import { ChannelInterface } from '../../../shared/models/channel.interface';
import { AsyncPipe } from '@angular/common';
import { CreateChannelFormComponent } from '../../../shared/forms/create-channel-form/create-channel-form.component';
import { ChannelSelectionService } from '../../../services/channel-selection.service';

@Component({
  selector: 'app-channel-list',
  imports: [AsyncPipe, CreateChannelFormComponent],
  templateUrl: './channel-list.component.html',
  styleUrl: './channel-list.component.scss'
})

export class ChannelListComponent {
  showPopup = false;

  channels$: Observable<ChannelInterface[]>;
  deletedChannels$: Observable<ChannelInterface[]>;
  selectedChannel: ChannelInterface | null = null;

  private channelSelectionService = inject(ChannelSelectionService);
  private channnelsService =  inject(ChannelsService); 

  constructor() {
    this.channels$ = this.channnelsService.getAllChannels();
    this.deletedChannels$ = this.channnelsService.getAllDeletedChannels();
  }


  selectChannel(channel: ChannelInterface) {
    this.channelSelectionService.selectChannel(channel);
  }


  openPopup() {
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
  }

  deleteChannel(channel:ChannelInterface) {
    console.log('Deleting channel:', channel.id);
    this.channnelsService.deleteChannel(channel.id!)
      .subscribe({
        next: () => {
          alert('Channel deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting channel:', error);
          alert('Failed to delete channel. Please try again later.');
        }
      });
  }
  
    addChannel(channel:ChannelInterface) {
    console.log('Deleting channel:', channel);
    this.channnelsService.addChannel(channel.id!)
      .subscribe({
        next: () => {
          alert('Channel deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting channel:', error);
          alert('Failed to delete channel. Please try again later.');
        }
      });
  }
}
