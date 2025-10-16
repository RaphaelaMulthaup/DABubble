import {
  Component,
  effect,
  ElementRef,
  EventEmitter,
  Output,
  Signal,
  ViewChild,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Observable, takeUntil, Subject, take } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SearchService } from '../../../../services/search.service';
import { JsonPipe } from '@angular/common';
import { SearchResult } from '../../../../shared/types/search-result.type';
import { UserListItemComponent } from '../../../../shared/components/user-list-item/user-list-item.component';
import { ChannelListItemComponent } from '../../../../shared/components/channel-list-item/channel-list-item.component';
import { OverlayService } from '../../../../services/overlay.service';
import { SearchResultsNewMessageComponent } from '../../../../overlay/search-results-new-message/search-results-new-message.component';
import { ScreenSize } from '../../../../shared/types/screen-size.type';
import { ScreenService } from '../../../../services/screen.service';
import { BaseSearchDirective } from '../../../../shared/directives/base-search.directive'; // passe Pfad ggf. an
import { OverlayPositionInterface } from '../../../../shared/models/overlay.position.interface';

@Component({
  selector: 'app-header-searchbar',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    JsonPipe,
    UserListItemComponent,
    ChannelListItemComponent,
    CommonModule,
  ],
  templateUrl: './header-searchbar.component.html',
  styleUrls: ['./header-searchbar.component.scss'],
})
export class HeaderSearchbarComponent
  extends BaseSearchDirective
  implements OnInit, OnDestroy
{
  @Output() resultsChange = new EventEmitter<SearchResult[]>();
  @Output() hasInputChange = new EventEmitter<boolean>();
  override destroy$ = new Subject<void>();
  results: Signal<SearchResult[]>;
  screenSize$!: Observable<ScreenSize>;
  private searchOverlayRef: any;
  @ViewChild('headerSearchbar', { static: true })
  headerSearchbar!: ElementRef<HTMLElement>;
  override term$: Observable<string>;

  constructor(
    private overlayService: OverlayService,
    public searchService: SearchService,
    public screenService: ScreenService
  ) {
    super();
    this.screenSize$ = this.screenService.screenSize$;
    this.term$ = this.createTerm$();
    this.results = toSignal(this.searchService.searchHeaderSearch(this.term$), {
      initialValue: [],
    });
    effect(() => {
      this.resultsChange.emit(this.results());
    });
  }

  ngOnInit() {
    this.setupFocusListener(this.headerSearchbar, () => {
      const term = this.searchControl.value.trim();
      if (term.length > 0) this.openSearchResultsNewMessageOverlay();
    });
    this.subscribeToTermChanges((term) => {
      const hasInput = term.length > 0;
      this.hasInputChange.emit(hasInput);
      if (hasInput) {
        this.openSearchResultsNewMessageOverlay();
      } else {
        this.overlayService.closeOne(this.searchOverlayRef?.overlayRef);
        this.searchOverlayRef = null;
      }
    });
  }

  override ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    super.ngOnDestroy();
  }

  /**
   * This function opens the SearchResultsNewMessage-Overlay.
   */
  openSearchResultsNewMessageOverlay() {
    this.screenSize$.pipe(take(1)).subscribe((size) => {
      if (size !== 'handset') return;
      if (this.searchOverlayRef) {
        this.searchOverlayRef.ref.instance.results = this.results;
        return;
      }
      this.searchOverlayRef = this.overlayService.openComponent(
        SearchResultsNewMessageComponent,
        'cdk-overlay-transparent-backdrop',
        this.getOverlayPosition(),
        { results: this.results }
      );
      if (!this.searchOverlayRef) return;
      this.handleOverlayBackdropClick(this.searchOverlayRef);
    });
  }

  /**
   * Returns the overlay-position and -position-fallback.
   */
  getOverlayPosition(): OverlayPositionInterface {
    return {
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
    };
  }

  /**
   * Handles the overlays behavior on backdrop-click.
   *
   * @param overlayRef - The SearchResultsNewMessage-Overlay.
   */
  handleOverlayBackdropClick(overlayRef: any) {
    overlayRef.backdropClick$
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchControl.setValue('');
        this.overlayService.closeOne(this.searchOverlayRef?.overlayRef);
        this.searchOverlayRef = null;
      });
  }
}
