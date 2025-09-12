import {
  Component,
  computed,
  ElementRef,
  inject,
  Signal,
  ViewChild,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  debounceTime,
  startWith,
  map,
  Observable,
  takeUntil,
  Subject,
  take,
} from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SearchService } from '../../../../services/search.service';
import { JsonPipe } from '@angular/common';
import { SearchResult } from '../../../../shared/types/search-result.type';
import { UserListItemComponent } from '../../../../shared/components/user-list-item/user-list-item.component';
import { ChannelListItemComponent } from '../../../../shared/components/channel-list-item/channel-list-item.component';
import { PostListItemComponent } from '../../../../shared/components/post-list-item/post-list-item.component';
import { UserInterface } from '../../../../shared/models/user.interface';
import { ChannelInterface } from '../../../../shared/models/channel.interface';
import { OverlayService } from '../../../../services/overlay.service';
import { SearchResultsComponent } from '../../../../overlay/search-results/search-results.component';
import { MobileService } from '../../../../services/mobile.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    JsonPipe,
    UserListItemComponent,
    ChannelListItemComponent,
    PostListItemComponent,
    CommonModule,
  ],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent implements OnInit, OnDestroy {
  // Reactive form control for capturing the search input value
  searchControl = new FormControl<string>('', { nonNullable: true });

  /***
   * Observable that emits the search term as the user types.
   * - startWith initializes with the current control value
   * - debounceTime waits 300ms after typing stops
   * - map trims whitespace from the input
   */
  private term$: Observable<string>;

  @ViewChild('searchbar', { static: true }) searchbar!: ElementRef<HTMLElement>;
  private destroy$ = new Subject<void>();

  /***
   * Converts the search results Observable into a signal for template binding.
   * Explicitly typed as SearchResult[] to ensure strong typing.
   * Provides an initial empty array until results are received.
   */
  results: Signal<SearchResult[]>;

  // Flag indicating if the app is in mobile view
  isMobile = false;
  private updateMobile: () => void;

  // Flag to track if search results are present
  searchResultsExisting: boolean = false;

  constructor(
    private overlayService: OverlayService,
    private searchService: SearchService,
    public mobileService: MobileService
  ) {
    this.updateMobile = () => {
      this.isMobile = this.mobileService.isMobile();
    };

    // Set up observable for search term changes
    this.term$ = this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value), // Starts with the initial value of the input
      debounceTime(300), // Waits for 300ms after typing stops
      map((v) => v.trim()) // Removes extra spaces from the input
    );

    // Converts the observable search results to a signal for use in the template
    this.results = toSignal(this.searchService.search(this.term$), {
      initialValue: [],
    });
  }

  ngOnInit() {
    // Check if the device is mobile on component init
    this.isMobile = this.mobileService.isMobile();
    window.addEventListener('resize', this.updateMobile); // Listen for window resize to update mobile status

    // Subscribe to the search term observable
    this.term$.pipe(takeUntil(this.destroy$)).subscribe((term) => {
      if (term.length > 0) {
        this.overlayService.closeAll(); // Close any open overlays when searching
        this.searchResultsExisting = true; // Set flag indicating search results are present
        this.openOverlay(term);
      } else {
        this.searchResultsExisting = false;
        this.overlayService.closeAll(); // Optionally close the overlay when search input is empty
      }
    });
    this.searchbar.nativeElement.addEventListener('focus', () => {
      const term = this.searchControl.value.trim();
      if (term.length > 0 && this.searchResultsExisting) {
        this.openOverlay(term);
      }
    });
  }

  ngOnDestroy() {
    // Clean up subscriptions when the component is destroyed
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Opens a search results overlay positioned relative to the search bar,
   * passing the current search term and grouped results to the overlay component,
   * and clears the search field if the overlay backdrop is clicked.
   */
  private openOverlay(term: string) {
    const overlay = this.overlayService.openComponent(
      SearchResultsComponent,
      'cdk-overlay-transparent-backdrop',
      {
        origin: this.searchbar.nativeElement, // Position the overlay relative to the search bar
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
        results$: this.groupedResults(), // Pass grouped results to the overlay component
        searchTerm: term, // Pass the search term to the overlay
      }
    );
    if (!overlay) return;

    overlay.backdropClick$
      .pipe(take(1), takeUntil(this.destroy$)) // take(1) = nur einmal pro Overlay, takeUntil = cleanup beim Component Destroy
      .subscribe(() => {
        this.searchControl.setValue(''); // Feld leeren
        this.searchResultsExisting = false;
      });
  }

  /***
   * Groups the search results into different categories based on their type (e.g., chat messages, channel messages).
   * - chat messages are grouped by user
   * - channel messages are grouped by channel
   */
  groupedResults = computed(() => {
    const res = this.results(); // Get the current search results

    const grouped: any[] = [];

    // Map to collect chat messages by user
    const chatMap = new Map<string, { user: UserInterface; posts: any[] }>();

    // Map to collect channel messages by channel
    const channelMap = new Map<
      string,
      { channel: ChannelInterface; posts: any[] }
    >();

    // Group messages by type (chatMessage or channelMessage)
    for (const item of res) {
      if (item.type === 'chatMessage') {
        if (!item.user) continue;
        if (!chatMap.has(item.user.uid)) {
          chatMap.set(item.user.uid, { user: item.user, posts: [] });
        }
        chatMap.get(item.user.uid)!.posts.push(item);
      } else if (item.type === 'channelMessage') {
        const channelId = item.channelId!;
        if (!channelMap.has(channelId)) {
          channelMap.set(channelId, { channel: item.channel, posts: [] });
        }
        channelMap.get(channelId)!.posts.push(item);
      } else {
        grouped.push(item); // For other types of items, just add them to the grouped array
      }
    }

    // Append all chat groups to the grouped results
    for (const [, value] of chatMap) {
      grouped.push({
        type: 'chatGroup',
        user: value.user,
        posts: value.posts,
      });
    }

    // Append all channel groups to the grouped results
    for (const [, value] of channelMap) {
      grouped.push({
        type: 'channelGroup',
        channel: value.channel,
        posts: value.posts,
      });
    }

    return grouped; // Return the grouped results
  });

  /***
   * Clears the search input and closes the overlay.
   * This function is used to reset the search and close the search results overlay.
   */
  closeOverlayAndEmptyInput() {
    console.log('IN THE FUNCTION');
    this.searchControl.setValue(''); // Reset the search input
    this.overlayService.closeAll(); // Close any open overlays
  }
}
