import { Component, inject } from '@angular/core';
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
  private searchService = inject(SearchService);

  // Eingabefeld
  searchControl = new FormControl<string>('', { nonNullable: true });

  // Suchterm-Observable
  private term$: Observable<string> = this.searchControl.valueChanges.pipe(
    startWith(this.searchControl.value),
    debounceTime(300),
    map((v) => v.trim())
  );

  // Ergebnisse aus dem Service
  results = toSignal(
    this.searchService.searchHeaderSearch(this.term$) as Observable<SearchResult[]>,
    { initialValue: [] as SearchResult[] }
  );
}
