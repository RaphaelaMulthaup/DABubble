import {
  Component,
  ElementRef,
  inject,
  Signal,
  ViewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  debounceTime,
  startWith,
  map,
  Observable,
  Subscription,
  takeUntil,
  Subject,
  take,
} from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SearchService } from '../../../services/search.service'; // Service for search functionality
import { JsonPipe } from '@angular/common'; // Pipe for converting objects to JSON
import { SearchResult } from '../../../shared/types/search-result.type'; // Type definition for search results
import { UserListItemComponent } from '../../../shared/components/user-list-item/user-list-item.component'; // Component to display user results
import { ChannelListItemComponent } from '../../../shared/components/channel-list-item/channel-list-item.component'; // Component to display channel results
import { OverlayService } from '../../../services/overlay.service'; // Service to manage overlays
import { SearchResultsNewMessageComponent } from '../../../overlay/search-results-new-message/search-results-new-message.component';
import { CommonModule } from '@angular/common'; // Component for displaying new search results in overlay

@Component({
  selector: 'app-header-searchbar', // The component selector
  standalone: true,
  imports: [
    ReactiveFormsModule, // Import ReactiveFormsModule for handling form controls
    JsonPipe, // Import JsonPipe to convert objects to JSON strings if needed
    UserListItemComponent, // Import user list component
    ChannelListItemComponent,
    CommonModule,
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
  // Subject used to signal component/service destruction for unsubscribing from observables
  private destroy$ = new Subject<void>();

  /**
   * Signal that holds the search results fetched from the search service.
   * It is a reactive representation of the search results.
   */
  results: Signal<SearchResult[]>;
  private searchOverlayRef: any;
  /**
   * ViewChild for accessing the HTML element of the search bar.
   * This is used to manage position of the overlay.
   */
  @ViewChild('headerSearchbar', { static: true })
  headerSearchbar!: ElementRef<HTMLElement>;
  // Observable that emits the current search term as a string
  term$: Observable<string>;

  constructor(
    public searchService: SearchService, // Inject SearchService for handling search logic
    private overlayService: OverlayService // Inject OverlayService to manage overlays
  ) {
    // Set up the observable for the search term input with debounce and trim
    this.term$ = this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value), // Start with the current value
      debounceTime(300), // Wait 300ms after user stops typing
      map((v) => v.trim()) // Remove any leading/trailing spaces from the input
    );

    // Convert the observable of search results into a signal (reactive state)
    this.results = toSignal(this.searchService.searchHeaderSearch(this.term$), {
      initialValue: [], // Initial value for the results is an empty array
    });
  }
  /**
   * Lifecycle hook that runs after component initialization.
   * Subscribes to the search term observable and dynamically opens or closes
   * the search results overlay depending on whether the user has entered text.
   */
  ngOnInit() {
    // Subscribe to the search term observable
    this.term$.pipe(takeUntil(this.destroy$)).subscribe((term) => {
      if (term.length > 0) {
        this.openOverlay(); // Overlay wiederverwenden oder neu öffnen
      } else {
        this.overlayService.closeOne(this.searchOverlayRef?.overlayRef);
        this.searchOverlayRef = null;
      }
    });
    this.headerSearchbar.nativeElement.addEventListener('focus', () => {
      const term = this.searchControl.value.trim();
      if (term.length > 0) {
        this.openOverlay();
      }
    });
  }

  /**
   * Lifecycle hook to clean up subscriptions when the component is destroyed.
   * This helps prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Opens a search results overlay positioned relative to the header search bar,
   * passes the current results as input, and clears the search field when the backdrop is clicked.
   */
  private openOverlay() {
    if (!this.results() || this.results().length === 0) {
      this.overlayService.closeOne(this.searchOverlayRef?.overlayRef);
      this.searchOverlayRef = null;
      return;
    }

    // Wenn Overlay schon offen ist, nur die Daten aktualisieren
    if (this.searchOverlayRef) {
      this.searchOverlayRef.ref.instance.results = this.results;
      return;
    }

    // Overlay neu öffnen
    this.searchOverlayRef = this.overlayService.openComponent(
      SearchResultsNewMessageComponent,
      'cdk-overlay-transparent-backdrop',
      {
        origin: this.headerSearchbar.nativeElement,
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
        results: this.results, // Pass the search term to the overlay
      }
    );
    if (!this.searchOverlayRef) return;

    // BackdropClick schließen
    this.searchOverlayRef.backdropClick$
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchControl.setValue(''); // Feld leeren
        this.overlayService.closeOne(this.searchOverlayRef?.overlayRef);
        this.searchOverlayRef = null;
      });
  }
}
