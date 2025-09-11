import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ChannelInterface } from '../../models/channel.interface'; // Importing the ChannelInterface for type safety
import { Router, RouterLink } from '@angular/router'; // Importing Angular's Router and RouterLink for navigation
import { CommonModule } from '@angular/common'; // Importing Angular's CommonModule for basic Angular functionality
import { MobileService } from '../../../services/mobile.service'; // Importing the MobileService to handle mobile-specific logic
import { SearchService } from '../../../services/search.service'; // Importing the SearchService to handle search operations

@Component({
  selector: 'app-channel-list-item', // Component selector for this item
  imports: [RouterLink, CommonModule], // Necessary imports for routing and common functionality
  templateUrl: './channel-list-item.component.html', // The component's template
  styleUrls: [
    './channel-list-item.component.scss', // Component-specific styles
    './../../../shared/styles/list-item.scss', // Shared list item styles
  ],
})
export class ChannelListItemComponent {
  constructor(
    public mobileService: MobileService, // Injecting MobileService for handling mobile-specific state
    private searchService: SearchService, // Injecting SearchService for search-related operations
    private router: Router // Injecting Router for navigation
  ) {}

  /**
   * The channel whose information should be displayed.
   * This is passed from the parent component.
   */
  @Input() channel!: ChannelInterface;

  /** Flag indicating if this channel is related to a search result post */
  @Input() relatedToSearchResultPost: boolean = false;

  /** Flag indicating if the channel is in search results in the current post input */
  @Input() isInSearchResultsCurrentPostInput: boolean = false;

  /**
   * EventEmitter to notify the parent component when a channel is selected.
   */
  @Output() channelSelected = new EventEmitter<ChannelInterface>();

  @Input() isInChannelHeader = false;

  /**
   * Removes focus from the current element and handles the click event.
   * It performs specific actions based on whether the component is part of a search result.
   *
   * - If not in search results, it removes focus, updates the mobile dashboard state,
   *   and navigates to the channel's page.
   */
  removeFocusAndHandleClick() {
    // Immediately remove focus before the click is processed
    if (!this.isInSearchResultsCurrentPostInput) {
      this.searchService.removeFocus(); // Remove focus from the search input
      this.mobileService.setMobileDashboardState('message-window'); // Update mobile dashboard state
      this.router.navigate(['/dashboard', 'channel', this.channel.id]); // Navigate to the channel's page
    }
  }

  /**
   * Emits the selected channel via the channelSelected EventEmitter.
   * This is used to notify the parent component of the selected channel.
   */
  emitChannel() {
    this.channelSelected.emit(this.channel); // Emit the channel data to the parent component
  }
}
