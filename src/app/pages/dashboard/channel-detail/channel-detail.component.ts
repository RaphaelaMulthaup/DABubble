import { Component, inject } from '@angular/core';
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
  /** The currently selected channel, or null if none is selected */
  channel: ChannelInterface | null = null;

  /** Service used to track the currently selected channel */
  private channelSelectionService = inject(ChannelSelectionService);

  /** Subscribes to the selected channel on initialization */
  ngOnInit() {
    this.channelSelectionService.selectedChannel$.subscribe(channel => {
      this.channel = channel; // Update the local channel whenever the selection changes
    });
  }
}
