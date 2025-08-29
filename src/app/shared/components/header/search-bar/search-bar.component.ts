import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, startWith, map, Observable } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SearchService } from '../../../../services/search.service';
import { JsonPipe } from '@angular/common';
import { SearchResult } from '../../../search-result.type';
import { ContactListItemComponent } from '../../contact-list-item/contact-list-item.component';
import { ChannelListItemComponent } from "../../channel-list-item/channel-list-item.component";

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe, ContactListItemComponent, ChannelListItemComponent],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent {
  // Inject the SearchService to use it inside the component
  searchService = inject(SearchService);

  // Reactive form control for capturing the search input value
  searchControl = new FormControl<string>('', { nonNullable: true });

  /***
   * Observable that emits the search term as the user types.
   * - startWith initializes with the current control value
   * - debounceTime waits 300ms after typing stops
   * - map trims whitespace from the input
   */
  private term$: Observable<string> = this.searchControl.valueChanges.pipe(
    startWith(this.searchControl.value),
    debounceTime(300),
    map((v) => v.trim())
  );

  /***
   * Converts the search results Observable into a signal for template binding.
   * Explicitly typed as SearchResult[] to ensure strong typing.
   * Provides an initial empty array until results are received.
   */
  results = toSignal(
    this.searchService.search(this.term$) as Observable<SearchResult[]>,
    { initialValue: [] as SearchResult[] }
  );
}
