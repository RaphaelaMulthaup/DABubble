import { Component, Input } from '@angular/core';
import { ChannelInterface } from '../../models/channel.interface';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-channel-list-item',
  imports: [RouterLink],
  templateUrl: './channel-list-item.component.html',
  styleUrls: [ './channel-list-item.component.scss',
    './../../../shared/styles/list-item.scss'],
})
export class ChannelListItemComponent {
  @Input() channel!: ChannelInterface;

}
