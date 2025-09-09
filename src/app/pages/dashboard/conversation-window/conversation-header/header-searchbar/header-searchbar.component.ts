import {
  Component,
  ElementRef,
  inject,
  Signal,
  ViewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, startWith, map, Observable } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SearchService } from '../../../../../services/search.service';
import { JsonPipe } from '@angular/common';
import { SearchResult } from '../../../../../shared/types/search-result.type';
import { UserListItemComponent } from '../../../../../shared/components/user-list-item/user-list-item.component';
import { ChannelListItemComponent } from '../../../../../shared/components/channel-list-item/channel-list-item.component';
import { OverlayService } from '../../../../../services/overlay.service';
import { SearchResultsNewMessageComponent } from '../../../../../overlay/search-results-new-message/search-results-new-message.component';

@Component({
  selector: 'app-header-searchbar',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    JsonPipe,
    UserListItemComponent,
    ChannelListItemComponent,
  ],
  templateUrl: './header-searchbar.component.html',
  styleUrls: ['./header-searchbar.component.scss'],
})
export class HeaderSearchbarComponent {
  // Eingabefeld
  searchControl = new FormControl<string>('', { nonNullable: true });

  // Ergebnisse aus dem Service
  results: Signal<SearchResult[]>;
  @ViewChild('headerSearchbar', { static: true })
  headerSearchbar!: ElementRef<HTMLElement>;

  constructor(
    private searchService: SearchService,
    private overlayService: OverlayService
  ) {
    // Suchterm-Observable mit debounce und trim
    const term$ = this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value),
      debounceTime(300),
      map((v) => v.trim())
    );

    // Konvertiere das Observable zu einem Signal
    this.results = toSignal(this.searchService.searchHeaderSearch(term$), {
      initialValue: [],
    });
  }

  ngDoCheck(): void {
    // Beobachte den Signal-Wert und öffne das Overlay, wenn Ergebnisse vorhanden sind
    if (this.results().length > 0) {
      this.openSearchResultsOverlay();
    } else {
      this.overlayService.closeAll(); // Overlay schließen, wenn keine Ergebnisse vorhanden sind
    }
  }
  // Methode, um das Overlay zu öffnen
  private openSearchResultsOverlay(): void {
    this.overlayService.closeAll();
    // const originElement = document.querySelector(
    //   '.input-wrapper'
    // ) as HTMLElement;
    this.overlayService.openComponent(
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
        results: this.results(),
      }
    );
  }
}
