import {
  Component,
  effect,
  ElementRef,
  EventEmitter,
  Output,
  Signal,
  ViewChild,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { startWith, map, Observable, takeUntil, Subject, take } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SearchService } from '../../../services/search.service';
import { JsonPipe } from '@angular/common';
import { SearchResult } from '../../../shared/types/search-result.type';
import { UserListItemComponent } from '../../../shared/components/user-list-item/user-list-item.component';
import { ChannelListItemComponent } from '../../../shared/components/channel-list-item/channel-list-item.component';
import { OverlayService } from '../../../services/overlay.service';
import { SearchResultsNewMessageComponent } from '../../../overlay/search-results-new-message/search-results-new-message.component';
import { ScreenSize } from '../../../shared/types/screen-size.type';
import { ScreenService } from '../../../services/screen.service';
import { BaseSearchDirective } from '../../../shared/directives/base-search.directive'; // passe Pfad ggf. an

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
export class HeaderSearchbarComponent extends BaseSearchDirective implements OnInit, OnDestroy {
  // FormControl ist bereits in BaseSearchDirective
  override destroy$ = new Subject<void>();

  results: Signal<SearchResult[]>;
  @Output() resultsChange = new EventEmitter<SearchResult[]>();
  @Output() hasInputChange = new EventEmitter<boolean>();
  screenSize$!: Observable<ScreenSize>;
  private searchOverlayRef: any;

  @ViewChild('headerSearchbar', { static: true })
  headerSearchbar!: ElementRef<HTMLElement>;

  override term$: Observable<string>;

  constructor(
    public searchService: SearchService,
    private overlayService: OverlayService,
    public screenService: ScreenService
  ) {
    super();
    this.screenSize$ = this.screenService.screenSize$;

    // Erzeuge term$ (Base helper) und hole die initialen Ergebnisse via searchHeaderSearch
    this.term$ = this.createTerm$();

    this.results = toSignal(this.searchService.searchHeaderSearch(this.term$), {
      initialValue: [],
    });

    effect(() => {
      this.resultsChange.emit(this.results());
    });
  }

  ngOnInit(): void {
    // Setze Fokuslistener (Base helper)
    this.setupFocusListener(this.headerSearchbar, () => {
      const term = this.searchControl.value.trim();
      if (term.length > 0) {
        this.openOverlay();
      }
    });

    // Term-Subscription: öffne/close overlay je nach Eingabe
    this.subscribeToTermChanges((term) => {
      const hasInput = term.length > 0;
      this.hasInputChange.emit(hasInput);
      if (hasInput) {
        this.openOverlay();
      } else {
        this.overlayService.closeOne(this.searchOverlayRef?.overlayRef);
        this.searchOverlayRef = null;
      }
    });
  }

  override ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    super.ngOnDestroy();
  }

  private openOverlay() {
    this.screenSize$.pipe(take(1)).subscribe((size) => {
      if (size !== 'handset') return; // only handset

      // Wenn Overlay schon offen ist, nur Daten aktualisieren
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
          results: this.results,
        }
      );
      if (!this.searchOverlayRef) return;

      // BackdropClick schließen
      this.searchOverlayRef.backdropClick$
        .pipe(take(1), takeUntil(this.destroy$))
        .subscribe(() => {
          this.searchControl.setValue('');
          this.overlayService.closeOne(this.searchOverlayRef?.overlayRef);
          this.searchOverlayRef = null;
        });
    });
  }
}
