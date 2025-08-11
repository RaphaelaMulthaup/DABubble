import { Component } from '@angular/core';
import { ChannelsService } from '../../../services/channels.service';
import { Observable } from 'rxjs';
import { ChannelInterface } from '../../../shared/models/channel.interface';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-channel-list',
  imports: [AsyncPipe],
  templateUrl: './channel-list.component.html',
  styleUrl: './channel-list.component.scss'
})
export class ChannelListComponent {
  channels$: Observable<ChannelInterface[]>;
  constructor(private channnelsService: ChannelsService) {
    this.channels$ = this.channnelsService.getAllChannels();
  }
}
