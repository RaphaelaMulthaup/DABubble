import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SearchResult } from '../../shared/types/search-result.type';
import { ChannelListItemComponent } from '../../shared/components/channel-list-item/channel-list-item.component';
import { UserListItemComponent } from '../../shared/components/user-list-item/user-list-item.component';
import { JsonPipe } from '@angular/common';
import { ChannelInterface } from '../../shared/models/channel.interface';
import { UserInterface } from '../../shared/models/user.interface';

@Component({
  selector: 'app-search-results-current-post-input',
  imports: [ChannelListItemComponent, UserListItemComponent, JsonPipe],
  templateUrl: './search-results-current-post-input.component.html',
  styleUrl: './search-results-current-post-input.component.scss',
})
export class SearchResultsCurrentPostInputComponent {
  @Input() results: SearchResult[] = [];
  @Output() userSelected = new EventEmitter<UserInterface>();
  @Output() channelSelected = new EventEmitter<ChannelInterface>();

  onUserSelected(user: UserInterface) {
    this.userSelected.emit(user);
  }

    onChannelSelected(channel: ChannelInterface) {
    this.channelSelected.emit(channel);
  }

}
