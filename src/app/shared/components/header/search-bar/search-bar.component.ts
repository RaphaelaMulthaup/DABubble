import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { SearchService } from '../../../../services/search.service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent {
  searchControl = new FormControl('');
  results: any[] = [];

  searchService = inject(SearchService);
  constructor() {}

  async ngOnInit() {
    // Daten laden
    await this.searchService.loadData();

    // Live-Suche mit Debounce
    this.searchControl.valueChanges
      .pipe(debounceTime(300))
      .subscribe((term) => {
        if (term && term.trim() !== '') {
          this.results = this.searchService.search(term);
        } else {
          this.results = [];
        }
      });
  }
}
