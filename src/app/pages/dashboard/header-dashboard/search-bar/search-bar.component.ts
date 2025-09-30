import {
  Component,
  computed,
  ElementRef,
  Signal,
  ViewChild,
  OnInit,
  OnDestroy
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  map,
  startWith,
  Observable,
  Subject,
  takeUntil
} from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SearchService } from '../../../../services/search.service';
import { JsonPipe, CommonModule } from '@angular/common';
import { OverlayService } from '../../../../services/overlay.service';
import { SearchResultsComponent } from '../../../../overlay/search-results/search-results.component';
import { UserListItemComponent } from '../../../../shared/components/user-list-item/user-list-item.component';
import { ChannelListItemComponent } from '../../../../shared/components/channel-list-item/channel-list-item.component';
import { PostListItemComponent } from '../../../../shared/components/post-list-item/post-list-item.component';
import { SearchResult } from '../../../../shared/types/search-result.type';
import { UserInterface } from '../../../../shared/models/user.interface';
import { ChannelInterface } from '../../../../shared/models/channel.interface';
import { ScreenSize } from '../../../../shared/types/screen-size.type';
import { ScreenService } from '../../../../services/screen.service';
import { ConnectedPosition } from '@angular/cdk/overlay';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    JsonPipe,
    CommonModule,
    UserListItemComponent,
    ChannelListItemComponent,
    PostListItemComponent,
  ],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent implements OnInit, OnDestroy {
  // Reactive form control for the search input
  searchControl = new FormControl<string>('', { nonNullable: true });
  firstFocusHappened = false; // Tracks if input was focused for the first time
  private destroy$ = new Subject<void>(); // Used to clean up subscriptions

  @ViewChild('searchbar', { static: true }) searchbar!: ElementRef<HTMLElement>;

  results: Signal<SearchResult[]>; // Reactive signal of search results
  screenSize$!: Observable<ScreenSize>; // Observable for screen size detection
  searchResultsExisting = false; // Flag to check if results exist
  private searchOverlayRef: any; // Reference to the overlay component

  constructor(
    public screenService: ScreenService,
    private overlayService: OverlayService,
    public searchService: SearchService
  ) {
    this.screenSize$ = this.screenService.screenSize$;
    // Initialize results as an empty array
    this.results = toSignal(this.searchService.results$, { initialValue: [] });
  }

  /**
   * Lifecycle hook called after component initialization.
   * Adds a focus listener to open the overlay when the input is focused.
   */
  ngOnInit() {
    this.searchbar.nativeElement.addEventListener('focus', () => {
      const term = this.searchControl.value.trim();
      if (term.length > 0) {
        this.openOverlay(term);
      }
    });
  }

  /**
   * Called when the search bar gains focus for the first time.
   * Sets up a debounced observable stream of input changes and updates results.
   * Also handles showing/hiding the overlay based on search input.
   */
  onFocus() {
    if (!this.firstFocusHappened) {
      this.firstFocusHappened = true;

      // Stream of search terms
      const term$ = this.searchControl.valueChanges.pipe(
        startWith(this.searchControl.value),
        map((v) => v.trim())
      );

      // Pass search term stream to the search service
      this.searchService.updateResults(term$);

      // Subscribe to search terms to manage overlay visibility
      term$.pipe(takeUntil(this.destroy$)).subscribe((term) => {
        if (term.length > 0) {
          this.searchResultsExisting = true;
          this.searchService.overlaySearchResultsOpen = true;
          this.openOverlay(term);
        } else {
          // Close overlay when input is cleared
          this.overlayService.closeOne(this.searchOverlayRef?.overlayRef);
          this.searchOverlayRef = null;
          this.searchResultsExisting = false;
          this.searchService.overlaySearchResultsOpen = false;
        }
      });
    }
  }

  /**
   * Opens the search results overlay below the search bar.
   * If overlay already exists, it updates its data instead of reopening.
   * Closes overlay on backdrop click and clears the input.
   */
  private openOverlay(term: string) {
    // If overlay is already open, update its inputs
    if (this.searchOverlayRef) {
      this.searchOverlayRef.ref.instance.results$ = this.groupedResults;
      this.searchOverlayRef.ref.instance.searchTerm = term;
      return;
    }

    // Determine overlay position based on screen size (mobile or desktop)
    let positionOverlay: {
      origin: HTMLElement;
      originPosition: ConnectedPosition;
      originPositionFallback?: ConnectedPosition;
    };

    this.screenSize$.subscribe((screenSize) => {
      positionOverlay =
        screenSize === 'handset'
          ? {
              origin: this.searchbar.nativeElement,
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
            }
          : {
              origin: this.searchbar.nativeElement,
              originPosition: {
                originX: 'start',
                originY: 'bottom',
                overlayX: 'start',
                overlayY: 'top',
              },
            };

      // Open overlay with initial data
      this.searchOverlayRef = this.overlayService.openComponent(
        SearchResultsComponent,
        'cdk-overlay-transparent-backdrop',
        positionOverlay,
        {
          results$: this.groupedResults,
          searchTerm: term,
        }
      );

      if (!this.searchOverlayRef) return;

      // Close overlay on backdrop click
      this.searchOverlayRef.backdropClick$
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.searchControl.setValue('');
          this.searchResultsExisting = false;
          this.searchService.overlaySearchResultsOpen = false;
          this.overlayService.closeOne(this.searchOverlayRef?.overlayRef);
          this.searchOverlayRef = null;
        });
    });
  }

  /**
   * Computes grouped search results for easier rendering.
   * Groups chat messages by user and channel messages by channel.
   * Returns both grouped and ungrouped results.
   */
  groupedResults = computed(() => {
    const res = this.results();
    const grouped: any[] = [];

    const chatMap = new Map<string, { user: UserInterface; posts: any[] }>();
    const channelMap = new Map<
      string,
      { channel: ChannelInterface; posts: any[] }
    >();

    for (const item of res) {
      if (item.type === 'chatMessage' && item.user) {
        // Group chat messages by user
        if (!chatMap.has(item.user.uid))
          chatMap.set(item.user.uid, { user: item.user, posts: [] });
        chatMap.get(item.user.uid)!.posts.push(item);
      } else if (item.type === 'channelMessage') {
        // Group channel messages by channel
        const channelId = item.channelId!;
        if (!channelMap.has(channelId))
          channelMap.set(channelId, { channel: item.channel, posts: [] });
        channelMap.get(channelId)!.posts.push(item);
      } else {
        // Keep other types ungrouped
        grouped.push(item);
      }
    }

    // Add grouped chat and channel results to the output
    chatMap.forEach((value) =>
      grouped.push({ type: 'chatGroup', user: value.user, posts: value.posts })
    );
    channelMap.forEach((value) =>
      grouped.push({
        type: 'channelGroup',
        channel: value.channel,
        posts: value.posts,
      })
    );

    return grouped;
  });

  /**
   * Lifecycle hook called before component is destroyed.
   * Completes the `destroy$` subject to unsubscribe from all observables.
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Closes the search overlay and clears the search input.
   */
  closeOverlayAndEmptyInput() {
    this.searchControl.setValue('');
    this.overlayService.closeAll();
  }
}
