import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SearchResult } from '../../shared/types/search-result.type'; // Importing the SearchResult type for strong typing
import { ChannelListItemComponent } from '../../shared/components/channel-list-item/channel-list-item.component'; // Importing channel list item component
import { UserListItemComponent } from '../../shared/components/user-list-item/user-list-item.component'; // Importing user list item component
import { JsonPipe } from '@angular/common'; // Importing JsonPipe to transform objects into JSON strings if needed
import { ChannelInterface } from '../../shared/models/channel.interface'; // Interface for channel data
import { UserInterface } from '../../shared/models/user.interface'; // Interface for user data

@Component({
  selector: 'app-search-results-current-post-input', // The selector for this component
  imports: [ChannelListItemComponent, UserListItemComponent, JsonPipe], // Necessary imports for child components and pipes
  templateUrl: './search-results-current-post-input.component.html', // The template for this component
  styleUrl: './search-results-current-post-input.component.scss', // Styles for this component
})
export class SearchResultsCurrentPostInputComponent {
  @Input() results: SearchResult[] = []; // Input property to receive search results of type SearchResult[]
  @Output() userSelected = new EventEmitter<UserInterface>(); // Output property to emit a selected user
  @Output() channelSelected = new EventEmitter<ChannelInterface>(); // Output property to emit a selected channel

  /**
   * Method triggered when a user is selected from the search results.
   * Emits the selected user via the userSelected EventEmitter.
   * 
   * @param user The selected user from the search results.
   */
  onUserSelected(user: UserInterface) {
    this.userSelected.emit(user); // Emits the user selection to the parent component
  }

  /**
   * Method triggered when a channel is selected from the search results.
   * Emits the selected channel via the channelSelected EventEmitter.
   * 
   * @param channel The selected channel from the search results.
   */
  onChannelSelected(channel: ChannelInterface) {
    this.channelSelected.emit(channel); // Emits the channel selection to the parent component
  }
}
