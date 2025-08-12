import { Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelInterface } from '../../../shared/models/channel.interface';
import { ChannelSelectionService } from '../../../services/channel-selection.service';

import { ChannelMessagesComponent } from "../channel-messages/channel-messages.component";
import { CreateThreadFormComponent } from "../../../shared/forms/create-thread-form/create-thread-form.component";


@Component({
  selector: 'app-channel-detail',
  imports: [CommonModule, ChannelMessagesComponent, CreateThreadFormComponent],
  templateUrl: './channel-detail.component.html',
  styleUrl: './channel-detail.component.scss'
})
export class ChannelDetailComponent {
  channel: ChannelInterface | null = null;
  private channelSelectionService = inject(ChannelSelectionService);

  ngOnInit() {
    this.channelSelectionService.selectedChannel$.subscribe(channel => {
      this.channel = channel; 
    });
  }
}
