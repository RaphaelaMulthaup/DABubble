import {
  Component,
  computed,
  ElementRef,
  Signal,
  ViewChild,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  debounceTime,
  map,
  startWith,
  Observable,
  Subject,
  EMPTY,
  takeUntil,
  of,
} from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SearchService } from '../../../../services/search.service';
import { JsonPipe, CommonModule } from '@angular/common';
import { OverlayService } from '../../../../services/overlay.service';
import { SearchResultsComponent } from '../../../../overlay/search-results/search-results.component';
import { UserListItemComponent } from '../../../../shared/components/user-list-item/user-list-item.component';
import { ChannelListItemComponent } from '../../../../shared/components/channel-list-item/channel-list-item.component';
import { PostListItemComponent } from '../../../../shared/components/post-list-item/post-list-item.component';
import { MobileService } from '../../../../services/mobile.service';
import { SearchResult } from '../../../../shared/types/search-result.type';
import { UserInterface } from '../../../../shared/models/user.interface';
import { ChannelInterface } from '../../../../shared/models/channel.interface';
import { ScreenSize } from '../../../../shared/types/screen-size.type';
import { ScreenService } from '../../../../services/screen.service';

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
  searchControl = new FormControl<string>('', { nonNullable: true });
  firstFocusHappened = false;
  private destroy$ = new Subject<void>(); // Subject to handle unsubscription

  @ViewChild('searchbar', { static: true }) searchbar!: ElementRef<HTMLElement>;

  results: Signal<SearchResult[]>; // Signal for template binding
  screenSize$!: Observable<ScreenSize>;
  searchResultsExisting = false;
  private searchOverlayRef: any;
  constructor(
    public screenService: ScreenService,
    private overlayService: OverlayService,
    public searchService: SearchService,
    public mobileService: MobileService
  ) {
    this.screenSize$ = this.screenService.screenSize$;
    // Initialize the results signal with an empty array
    this.results = toSignal(this.searchService.results$, { initialValue: [] });
  }

  /**
   * Lifecycle hook called after component initialization.
   * Sets mobile detection and adds focus listener to search input.
   */
  ngOnInit() {
    // Overlay focus logic
    this.searchbar.nativeElement.addEventListener('focus', () => {
      const term = this.searchControl.value.trim();
      if (
        term.length > 0
        //  && this.searchResultsExisting
      ) {
        this.openOverlay(term);
      }
    });
  }

  /**
   * Initializes the input observable and handles the search logic.
   * Runs only on the first focus event to avoid multiple subscriptions.
   */
  onFocus() {
    if (!this.firstFocusHappened) {
      this.firstFocusHappened = true;

      // Observable for input changes with debounce
      const term$ = this.searchControl.valueChanges.pipe(
        startWith(this.searchControl.value),
        debounceTime(300),
        map((v) => v.trim())
      );

      this.searchService.updateResults(term$);

      // Subscribe to search terms to open or close overlay accordingly
      term$.pipe(takeUntil(this.destroy$)).subscribe((term) => {
        if (term.length > 0) {
          this.searchResultsExisting = true;
          this.searchService.overlaySearchResultsOpen = true;
          this.openOverlay(term); // Overlay wiederverwenden oder neu öffnen
        } else {
          // this.searchOverlayRef?.close();
          this.overlayService.closeOne(this.searchOverlayRef?.overlayRef);
          this.searchOverlayRef = null;
          this.searchResultsExisting = false;
          this.searchService.overlaySearchResultsOpen = false;
        }
      });
    }
  }

  /**
   * Opens the search results overlay positioned relative to the search bar.
   * Handles backdrop clicks to close overlay and reset input.
   */
  private openOverlay(term: string) {

    // Overlay schon offen → nur die Daten aktualisieren
    if (this.searchOverlayRef) {
      this.searchOverlayRef.ref.instance.results$ = this.groupedResults;
      this.searchOverlayRef.ref.instance.searchTerm = term;
      return;
    }

    // Overlay neu öffnen
    this.searchOverlayRef = this.overlayService.openComponent(
      SearchResultsComponent,
      'cdk-overlay-transparent-backdrop',
      {
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
      },
      {
        results$: this.groupedResults,
        searchTerm: term,
      }
    );

    if (!this.searchOverlayRef) return;

    // BackdropClick → Overlay schließen und Input leeren
    this.searchOverlayRef.backdropClick$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchControl.setValue('');
        this.searchResultsExisting = false;
        this.searchService.overlaySearchResultsOpen = false;
        this.overlayService.closeOne(this.searchOverlayRef?.overlayRef);
        this.searchOverlayRef = null;
      });
  }

  /**
   * Computes and groups search results by user and channel.
   * Returns an array of grouped and ungrouped results for display.
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
        if (!chatMap.has(item.user.uid))
          chatMap.set(item.user.uid, { user: item.user, posts: [] });
        chatMap.get(item.user.uid)!.posts.push(item);
      } else if (item.type === 'channelMessage') {
        const channelId = item.channelId!;
        if (!channelMap.has(channelId))
          channelMap.set(channelId, { channel: item.channel, posts: [] });
        channelMap.get(channelId)!.posts.push(item);
      } else {
        grouped.push(item); // Other types remain ungrouped
      }
    }

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
   * Lifecycle hook called before component destruction.
   * Completes the destroy$ subject to unsubscribe all active observables.
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Closes the overlay and clears the search input.
   */
  closeOverlayAndEmptyInput() {
    this.searchControl.setValue('');
    this.overlayService.closeAll();
  }
}
