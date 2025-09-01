import { Component, Input } from '@angular/core';
import { ChannelInterface } from '../../models/channel.interface';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-channel-list-item',
  imports: [RouterLink, CommonModule],
  templateUrl: './channel-list-item.component.html',
  styleUrls: [
    './channel-list-item.component.scss',
    './../../../shared/styles/list-item.scss',
  ],
})
export class ChannelListItemComponent {
  /** The channel whose information should be displayed. This is passed from the parent component. */
  @Input() channel!: ChannelInterface;
  @Input() relatedToSearchResultPost: boolean = false;
}
