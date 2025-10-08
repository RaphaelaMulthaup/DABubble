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
import { map, startWith, Observable, Subject, takeUntil } from 'rxjs';
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
import { BaseSearchDirective } from '../../../../shared/directives/base-search.directive'; // passe Pfad ggf. an

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
export class SearchBarComponent
  extends BaseSearchDirective
  implements OnInit, OnDestroy
{
  // Reactive form control ist bereits in BaseSearchDirective vorhanden
  firstFocusHappened = false; // Tracks if input was focused for the first time
  override destroy$ = new Subject<void>(); // für lokale subscriptions (zusätzlich zur base destroy$)

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
    super();
    this.screenSize$ = this.screenService.screenSize$;
    // Initialize results as an empty array (Service liefert die BehaviorSubject-Quelle)
    this.results = toSignal(this.searchService.results$, { initialValue: [] });
  }

  ngOnInit(): void {
    // Fokuslistener via Base helper; öffnet Overlay nur wenn Feld Inhalt hat.
    this.setupFocusListener(this.searchbar, () => {
      const term = this.searchControl.value.trim();
      if (term.length > 0) {
        this.openOverlay(term);
      }
    });
  }

  /**
   * Wird beim ersten Focus aufgerufen (wie vorher in deinem Code - onFocus).
   * Legt term$ an, startet updateResults und subscribes zur Steuerung des Overlays.
   */
  onFocus() {
    if (!this.firstFocusHappened) {
      this.firstFocusHappened = true;

      // Stream of search terms (Base bietet createTerm$)
      const term$ = this.createTerm$();

      // Pass search term stream to the search service
      this.searchService.updateResults(term$);

      // Subscribe to search terms to manage overlay visibility
      this.subscribeToTermChanges((term) => {
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
   * Öffnet das Overlay — Overlay-Logik bleibt in der concrete Komponente.
   */
  private openOverlay(term: string) {
    // Wenn overlay bereits offen, aktualisiere Inputs
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

    this.screenSize$.pipe(takeUntil(this.destroy$)).subscribe((screenSize) => {
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

      // Allgemeines "afterClosed"-Abonnement
      this.searchOverlayRef.overlayRef
        .detachments() // detachments() feuert, wenn Overlay entfernt wird
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.searchControl.setValue('');
          this.searchResultsExisting = false;
          this.searchService.overlaySearchResultsOpen = false;
          this.searchOverlayRef = null;
        });

      // Nur backdropClick zusätzlich, falls du spezielle Logik dafür willst
      this.searchOverlayRef.backdropClick$
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.overlayService.closeOne(this.searchOverlayRef?.overlayRef);
        });
    });
  }

  /**
   * Gruppiert chat- / channel messages wie vorher für die Darstellung im Overlay.
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
        grouped.push(item);
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

  override ngOnDestroy(): void {
    // lokale und Basisklassen Aufräumarbeiten
    this.destroy$.next();
    this.destroy$.complete();
    super.ngOnDestroy();
  }

  /**
   * Closes the search overlay and clears the search input.
   */
  closeOverlayAndEmptyInput() {
    this.searchControl.setValue('');
    this.overlayService.closeAll();
  }
}
