import { Component, Input, Signal } from '@angular/core';
import { SearchResult } from '../../shared/types/search-result.type';
import { UserListItemComponent } from '../../shared/components/user-list-item/user-list-item.component';
import { ChannelListItemComponent } from '../../shared/components/channel-list-item/channel-list-item.component';
import { JsonPipe } from '@angular/common';

/**
 * Component that displays the search results for new messages.
 * It takes the results as input and renders them using the appropriate list item components.
 */
@Component({
  selector: 'app-search-results-new-message', // Defines the component selector for HTML usage
  imports: [UserListItemComponent, ChannelListItemComponent, JsonPipe], // Imports components and pipes for rendering user and channel list items, and JSON formatting
  templateUrl: './search-results-new-message.component.html', // Path to the component's HTML template
  styleUrl: './search-results-new-message.component.scss', // Path to the component's styling file
})
export class SearchResultsNewMessageComponent {
  /**
   * The search results passed to the component.
   * This array holds the search results which are of type `SearchResult[]`.
   * It is passed from the parent component via Angular's Input mechanism.
   */
  @Input() results!: Signal<SearchResult[]>;
}
