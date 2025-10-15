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
  /**
   * Signal containing the current array of search results.
   * The results can be of different types (users, channels, posts),
   * and will be rendered dynamically by the corresponding list components.
   */
  @Input() results: SearchResult[] = [];
  @Output() userSelected = new EventEmitter<UserInterface>();
  @Output() channelSelected = new EventEmitter<ChannelInterface>();

  constructor() {}

  /**
   * Method triggered when a user is selected from the search results.
   * Emits the selected user via the userSelected EventEmitter.
   *
   * @param user - The selected user from the search results.
   */
  onUserSelected(user: UserInterface) {
    this.userSelected.emit(user);
  }

  /**
   * Method triggered when a channel is selected from the search results.
   * Emits the selected channel via the channelSelected EventEmitter.
   *
   * @param channel - The selected channel from the search results.
   */
  onChannelSelected(channel: ChannelInterface) {
    this.channelSelected.emit(channel);
  }
}
