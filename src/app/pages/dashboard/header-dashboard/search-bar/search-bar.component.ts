import {
  Component,
  computed,
  ElementRef,
  Signal,
  ViewChild,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, Observable, Subject, take, takeUntil } from 'rxjs';
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
import { BaseSearchDirective } from '../../../../shared/directives/base-search.directive';
import { OverlayPositionInterface } from '../../../../shared/models/overlay.position.interface';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent extends BaseSearchDirective implements OnInit, OnDestroy {
  @ViewChild('searchbar', { static: true }) searchbar!: ElementRef<HTMLElement>;
  results: Signal<SearchResult[]>;
  screenSize$!: Observable<ScreenSize>;
  override destroy$ = new Subject<void>();
  private searchOverlayRef: any;
  firstFocusHappened: boolean = false;
  searchResultsExisting$ = new BehaviorSubject<boolean>(false);
  groupedResults = computed(() => {
    const res = this.results();
    const grouped: any[] = [];
    const chatMap = this.groupChatMessages(res);
    const channelMap = this.groupChannelMessages(res);
    for (const item of res) {
      if (item.type !== 'chatMessage' && item.type !== 'channelMessage') grouped.push(item);
    }
    chatMap.forEach((value) => grouped.push({ type: 'chatGroup', ...value }));
    channelMap.forEach((value) =>
      grouped.push({ type: 'channelGroup', ...value })
    );
    return grouped;
  });

  constructor(
    private overlayService: OverlayService,
    public screenService: ScreenService,
    public searchService: SearchService
  ) {
    super();
    this.results = toSignal(this.searchService.results$, { initialValue: [] });
    this.screenSize$ = this.screenService.screenSize$;
  }

  ngOnInit() {
    this.setupFocusListener(this.searchbar, () => {
      const term = this.searchControl.value.trim();
      if (term.length > 0) this.openSearchResultsOverlay(term);
    });
  }

  override ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    super.ngOnDestroy();
  }

  /**
   * Triggered when the search input gains focus for the first time.
   * Initializes the term stream, updates initial search results,
   * and subscribes to term changes to open or close the search overlay dynamically.
   */
  onFocus() {
    if (!this.firstFocusHappened) {
      this.firstFocusHappened = true;
      const term$ = this.createTerm$();
      this.searchService.updateResults(term$);
      this.subscribeToTermChanges((term) => {
        if (term.length > 0) {
          this.searchResultsExisting$.next(true);
          this.searchService.overlaySearchResultsOpen = true;
          this.openSearchResultsOverlay(term);
        } else this.closeOverlayForEmptyInput();
      });
    }
  }

  /**
   * Closes the SearchResults-Overlay when the input is cleared.
   */
  closeOverlayForEmptyInput() {
    this.overlayService.closeOne(this.searchOverlayRef?.overlayRef);
    this.searchOverlayRef = null;
    this.searchResultsExisting$.next(false);
    this.searchService.overlaySearchResultsOpen = false;
  }

  /**
   * This function opens the SearchResults-Overlay.
   *
   * @param term - The search-term used to show fitting results.
   */
  openSearchResultsOverlay(term: string) {
    if (this.searchOverlayRef) return this.updateResults(term);
    this.searchOverlayRef = this.overlayService.openComponent(
      SearchResultsComponent,
      'cdk-overlay-transparent-backdrop',
      this.resolveOverlayPosition(),
      {
        results$: this.groupedResults,
        searchTerm: term,
      }
    );
    if (!this.searchOverlayRef) return;
    this.handleOverlayLifecycle(this.searchOverlayRef);
  }

  /**
   * Updates the search-results if the input changed.
   *
   * @param term - The search-term used to show fitting results.
   */
  updateResults(term: string) {
    this.searchOverlayRef.ref.instance.results$ = this.groupedResults;
    this.searchOverlayRef.ref.instance.searchTerm = term;
    return;
  }

  /**
   * Checks the screenSize and returns the according overlay-position.
   */
  resolveOverlayPosition() {
    let positionOverlay: OverlayPositionInterface;
    let screenSize;
    this.screenSize$
      .pipe(take(1))
      .subscribe((currentScreenSize) => (screenSize = currentScreenSize));
    if (screenSize === 'handset') {
      return (positionOverlay = this.getOverlayPositionHandset());
    } else {
      return (positionOverlay = this.getOverlayPositionTabletWeb());
    }
  }

  /**
   * Returns the overlay-position for handset.
   */
  getOverlayPositionHandset(): OverlayPositionInterface {
    return {
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
    };
  }

  /**
   * Returns the overlay-position for tablet and web.
   */
  getOverlayPositionTabletWeb(): OverlayPositionInterface {
    return {
      origin: this.searchbar.nativeElement,
      originPosition: {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top',
      },
    };
  }

  /**
   * Handles the overlays lifecylcle by closing it on overlay-detach and backdrop-click.
   *
   * @param overlayRef - The SearchResults-Overlay.
   */
  handleOverlayLifecycle(overlayRef: any) {
    overlayRef.overlayRef
      .detachments()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchControl.setValue('');
        this.searchResultsExisting$.next(false);
        this.searchService.overlaySearchResultsOpen = false;
        this.searchOverlayRef = null;
      });
    overlayRef.backdropClick$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.searchResultsExisting$.next(false);
      this.overlayService.closeOne(overlayRef.overlayRef);
    });
  }

  /**
   * Closes the search overlay and clears the search input.
   */
  closeOverlayAndEmptyInput() {
    this.searchResultsExisting$.next(false);
    this.searchControl.setValue('');
    this.overlayService.closeAll();
  }

  /**
   * Groups all chat message results by user.
   * Each user ID is mapped to an object containing the user and their associated chat messages.
   *
   * @param res - Array of result items to process.
   */
  groupChatMessages(res: any[]) {
    const map = new Map<string, { user: UserInterface; posts: any[] }>();
    for (const item of res) {
      if (item.type === 'chatMessage' && item.user) {
        if (!map.has(item.user.uid))
          map.set(item.user.uid, { user: item.user, posts: [] });
        map.get(item.user.uid)!.posts.push(item);
      }
    }
    return map;
  }

  /**
   * Groups all channel message results by channel.
   * Each channel ID is mapped to an object containing the channel and its associated channel messages.
   *
   * @param res - Array of result items to process.
   */
  groupChannelMessages(res: any[]) {
    const map = new Map<string, { channel: ChannelInterface; posts: any[] }>();
    for (const item of res) {
      if (item.type === 'channelMessage') {
        const channelId = item.channelId!;
        if (!map.has(channelId))
          map.set(channelId, { channel: item.channel, posts: [] });
        map.get(channelId)!.posts.push(item);
      }
    }
    return map;
  }
}
