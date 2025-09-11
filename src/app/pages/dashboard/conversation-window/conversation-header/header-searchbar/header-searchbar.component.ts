import {
  Component,
  ElementRef,
  inject,
  Signal,
  ViewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, startWith, map, Observable, Subscription } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SearchService } from '../../../../../services/search.service'; // Service for search functionality
import { JsonPipe } from '@angular/common'; // Pipe for converting objects to JSON
import { SearchResult } from '../../../../../shared/types/search-result.type'; // Type definition for search results
import { UserListItemComponent } from '../../../../../shared/components/user-list-item/user-list-item.component'; // Component to display user results
import { ChannelListItemComponent } from '../../../../../shared/components/channel-list-item/channel-list-item.component'; // Component to display channel results
import { OverlayService } from '../../../../../services/overlay.service'; // Service to manage overlays
import { SearchResultsNewMessageComponent } from '../../../../../overlay/search-results-new-message/search-results-new-message.component'; // Component for displaying new search results in overlay

@Component({
  selector: 'app-header-searchbar', // The component selector
  standalone: true,
  imports: [
    ReactiveFormsModule, // Import ReactiveFormsModule for handling form controls
    JsonPipe, // Import JsonPipe to convert objects to JSON strings if needed
    UserListItemComponent, // Import user list component
    ChannelListItemComponent, // Import channel list component
  ],
  templateUrl: './header-searchbar.component.html', // The template for this component
  styleUrls: ['./header-searchbar.component.scss'], // Styles for this component
})
export class HeaderSearchbarComponent {
  /** 
   * Form control for the search input field. 
   * It is initialized with an empty string and has the nonNullable option set to true.
   */
  searchControl = new FormControl<string>('', { nonNullable: true });

  /** 
   * Signal that holds the search results fetched from the search service.
   * It is a reactive representation of the search results.
   */
  results: Signal<SearchResult[]>;

  /** 
   * ViewChild for accessing the HTML element of the search bar. 
   * This is used to manage focus and position of the overlay.
   */
  @ViewChild('headerSearchbar', { static: true })
  headerSearchbar!: ElementRef<HTMLElement>;

  /** 
   * Subscription to manage focus removal from the search input.
   */
  private focusSubscription: Subscription;

  constructor(
    private searchService: SearchService, // Inject SearchService for handling search logic
    private overlayService: OverlayService // Inject OverlayService to manage overlays
  ) {
    // Set up the observable for the search term input with debounce and trim
    const term$ = this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value), // Start with the current value
      debounceTime(300), // Wait 300ms after user stops typing
      map((v) => v.trim()) // Remove any leading/trailing spaces from the input
    );

    // Convert the observable of search results into a signal (reactive state)
    this.results = toSignal(this.searchService.searchHeaderSearch(term$), {
      initialValue: [], // Initial value for the results is an empty array
    });

    // Subscribe to the focusRemoved observable from the search service
    // This will call removeFocus() when focus is removed
    this.focusSubscription = this.searchService.focusRemoved$.subscribe(() => {
      this.removeFocus(); // Call the method to remove focus from the search input
    });
  }

  /** 
   * This lifecycle hook checks the results every time Angular runs change detection. 
   * If results are found, it opens the search results overlay, otherwise it closes it.
   */
  ngDoCheck(): void {
    if (this.results().length > 0) {
      this.openSearchResultsOverlay(); // Open the overlay if there are results
    } else {
      this.overlayService.closeAll(); // Close the overlay if no results
    }
  }

  /** 
   * Lifecycle hook to clean up subscriptions when the component is destroyed.
   * This helps prevent memory leaks.
   */
  ngOnDestroy(): void {
    if (this.focusSubscription) {
      this.focusSubscription.unsubscribe(); // Unsubscribe from the focusRemoved observable
    }
  }

  /** 
   * Opens the search results overlay to display the search results in a new message component.
   * The overlay is positioned relative to the search bar.
   */
  private openSearchResultsOverlay(): void {
    this.overlayService.closeAll(); // Close all existing overlays

    // Open a new overlay with the SearchResultsNewMessageComponent
    this.overlayService.openComponent(
      SearchResultsNewMessageComponent, // Component to display search results
      'cdk-overlay-transparent-backdrop', // Backdrop class for the overlay
      {
        origin: this.headerSearchbar.nativeElement, // Set the origin element to the search bar
        originPosition: {
          originX: 'center',
          originY: 'bottom',
          overlayX: 'center',
          overlayY: 'bottom',
        },
        originPositionFallback: {
          originX: 'center',
          originY: 'bottom',
          overlayX: 'center',
          overlayY: 'top',
        },
      },
      {
        results: this.results(), // Pass the search results as input to the overlay component
      }
    );
  }

  /** 
   * Removes focus from the search input field by calling blur on the input element.
   */
  removeFocus() {
    this.headerSearchbar.nativeElement.querySelector('input')?.blur(); // Remove focus from the input element
  }
}
