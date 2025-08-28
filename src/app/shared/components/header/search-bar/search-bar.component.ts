import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, startWith, map, Observable } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SearchService } from '../../../../services/search.service';
import { JsonPipe } from '@angular/common';
import { SearchResult } from '../../../search-result.type'


@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe ],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent {
  searchService = inject(SearchService);

  searchControl = new FormControl<string>('', { nonNullable: true });

  private term$: Observable<string> = this.searchControl.valueChanges.pipe(
    startWith(this.searchControl.value),
    debounceTime(300),
    map((v) => v.trim())
  );

  // 👇 Hier den generischen Typ explizit angeben
  results = toSignal(
    this.searchService.search(this.term$) as Observable<SearchResult[]>,
    { initialValue: [] as SearchResult[] }
  );
}
