import { Component, Input } from '@angular/core';
import { UserListItemComponent } from '../../shared/components/user-list-item/user-list-item.component'; // Importing the user list item component for rendering individual user results
import { ChannelListItemComponent } from '../../shared/components/channel-list-item/channel-list-item.component'; // Importing the channel list item component for rendering individual channel results
import { PostListItemComponent } from '../../shared/components/post-list-item/post-list-item.component'; // Importing the post list item component for rendering individual post results
import { OverlayService } from '../../services/overlay.service'; // Importing the OverlayService to handle overlays for additional views

@Component({
  selector: 'app-search-results', // The component selector that will be used in the parent template
  imports: [
    UserListItemComponent, // Including UserListItemComponent as part of the search results
    ChannelListItemComponent, // Including ChannelListItemComponent as part of the search results
    PostListItemComponent, // Including PostListItemComponent as part of the search results
  ],
  templateUrl: './search-results.component.html', // The HTML template for this component
  styleUrl: './search-results.component.scss', // The styles specific to this component
})
export class SearchResultsComponent {
  /** 
   * Input property that receives an array of search results. 
   * This array can contain users, channels, or posts based on the search context.
   */
  @Input() results$: any[] = [];

  /** 
   * Input property that receives the search term. 
   * This is used to display or highlight the search query.
   */
  @Input() searchTerm: string = '';

  /** 
   * Constructor that injects the OverlayService to manage overlay-related functionality. 
   * The OverlayService can be used to open or close various overlays, like profile views.
   */
  constructor(public overlayService: OverlayService) {}
}
