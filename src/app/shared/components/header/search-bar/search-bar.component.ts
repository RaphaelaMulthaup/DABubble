import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, startWith, map, Observable } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SearchService } from '../../../../services/search.service';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe ],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent {
    // Falls du noch andere Dinge injizierst:
  searchService = inject(SearchService);
  // Non-nullable => valueChanges ist Observable<string> (kein null mehr)
  searchControl = new FormControl<string>('', { nonNullable: true });

  private term$: Observable<string> = this.searchControl.valueChanges.pipe(
    startWith(this.searchControl.value),
    debounceTime(300),
    map(v => v.trim())
  );

  // results als Signal via toSignal – keine manuellen Subscribes nötig
  results = toSignal(this.searchService.search(this.term$), { initialValue: [] });


}
