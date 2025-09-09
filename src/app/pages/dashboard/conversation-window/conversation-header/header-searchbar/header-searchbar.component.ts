import { Component, inject, Signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, startWith, map, Observable } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SearchService } from '../../../../../services/search.service';
import { JsonPipe } from '@angular/common';
import { SearchResult } from '../../../../../shared/types/search-result.type';
import { UserListItemComponent } from '../../../../../shared/components/user-list-item/user-list-item.component';
import { ChannelListItemComponent } from '../../../../../shared/components/channel-list-item/channel-list-item.component';

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

  constructor(private searchService: SearchService) {
    // Suchterm-Observable mit debounce und trim
    const term$ = this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value),
      debounceTime(300),
      map((v) => v.trim())
    );
    
    // Konvertiere das Observable zu einem Signal
    this.results = toSignal(
      this.searchService.searchHeaderSearch(term$),
      { initialValue: [] }
    );
  }
}

// import { Component, inject, Signal } from '@angular/core';
// import { FormControl, ReactiveFormsModule } from '@angular/forms';
// import { debounceTime, startWith, map, Observable } from 'rxjs';
// import { toSignal } from '@angular/core/rxjs-interop';
// import { SearchService } from '../../../../../services/search.service';
// import { JsonPipe } from '@angular/common';
// import { SearchResult } from '../../../../../shared/types/search-result.type';
// import { UserListItemComponent } from '../../../../../shared/components/user-list-item/user-list-item.component';
// import { ChannelListItemComponent } from '../../../../../shared/components/channel-list-item/channel-list-item.component';

// @Component({
//   selector: 'app-header-searchbar',
//   standalone: true,
//   imports: [
//     ReactiveFormsModule,
//     JsonPipe,
//     UserListItemComponent,
//     ChannelListItemComponent,
//   ],
//   templateUrl: './header-searchbar.component.html',
//   styleUrls: ['./header-searchbar.component.scss'],
// })
// export class HeaderSearchbarComponent {
//   // Eingabefeld
//   searchControl = new FormControl<string>('', { nonNullable: true });
//   // Suchterm-Observable
//   private term$: Observable<string>;
//   // Ergebnisse aus dem Service
//   results: Signal<SearchResult[]>;

//   constructor(private searchService: SearchService) {
//     this.term$ = this.searchControl.valueChanges.pipe(
//       startWith(this.searchControl.value),
//       debounceTime(300),
//       map((v) => v.trim())
//     );
//     this.results = toSignal(
//       this.searchService.searchHeaderSearch(this.term$) as Observable<
//         SearchResult[]
//       >,
//       { initialValue: [] as SearchResult[] }
//     );
//   }
// }
