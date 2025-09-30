import { Component, HostBinding, Input, Signal } from '@angular/core';
import { UserListItemComponent } from '../../shared/components/user-list-item/user-list-item.component'; // Renders individual user results
import { ChannelListItemComponent } from '../../shared/components/channel-list-item/channel-list-item.component'; // Renders individual channel results
import { PostListItemComponent } from '../../shared/components/post-list-item/post-list-item.component'; // Renders individual post results
import { OverlayService } from '../../services/overlay.service';
import { CommonModule } from '@angular/common';
import { ScreenService } from '../../services/screen.service';
import { Observable, Subscription } from 'rxjs';
import { ScreenSize } from '../../shared/types/screen-size.type';

@Component({
  selector: 'app-search-results', // Selector used to include this component in a template
  imports: [
    UserListItemComponent,
    ChannelListItemComponent,
    PostListItemComponent,
    CommonModule,
  ],
  templateUrl: './search-results.component.html', // Component template file
  styleUrl: './search-results.component.scss', // Component styles
})
export class SearchResultsComponent {
  /**
   * Signal containing the current array of search results.
   * The results can be of different types (users, channels, posts),
   * and will be rendered dynamically by the corresponding list components.
   */
  @Input() results$!: Signal<any[]>;

  /**
   * The search term entered by the user.
   * Used for displaying or highlighting the query in the UI.
   */
  @Input() searchTerm: string = '';

  screenSize$!: Observable<ScreenSize>; // Observable for current screen size (e.g., handset, tablet, web)
  private subscription!: Subscription; // Subscription to manage screen size updates
  private screenSize: string | null = null; // Holds the latest screen size for conditional logic

  /**
   * Injects services for overlay management and screen size detection.
   * @param overlayService - Service to control overlay behavior
   * @param screenService - Service that emits screen size changes
   */
  constructor(
    public overlayService: OverlayService,
    public screenService: ScreenService
  ) {
    // Subscribe to screen size observable from ScreenService
    this.screenSize$ = this.screenService.screenSize$;
  }

  /**
   * Lifecycle hook: Called once after component initialization.
   * Subscribes to the screen size observable to react to device changes.
   */
  ngOnInit(): void {
    // Subscribe to screen size changes and store the current value
    this.subscription = this.screenService.screenSize$.subscribe((size) => {
      this.screenSize = size;
    });
  }

  /**
   * Lifecycle hook: Called just before the component is destroyed.
   * Cleans up the subscription to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Host binding for the `overlay-web` CSS class.
   * Applies the class only if the screen size is NOT 'handset' (i.e., desktop or tablet view).
   * This allows for different styling and positioning of the overlay depending on device type.
   * @returns {boolean} - True if class should be applied, false otherwise.
   */
  @HostBinding('class.overlay-web')
  get overlayWeb(): boolean {
    return this.screenSize !== 'handset';
  }
}
