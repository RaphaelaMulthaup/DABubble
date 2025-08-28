// Komplette SearchBarComponent
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, startWith, map, Observable } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SearchService } from '../../../../services/search.service';
import { JsonPipe } from '@angular/common';
// import { SearchResult } from '../../../../services/search.service'; // Typ importieren

interface User {
  id: string;
  name: string;
  email: string;
}

interface Channel {
  id: string;
  name: string;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  chatId?: string;
  channelId?: string;
}

interface Answer extends Message {
  parentMessageId: string;
}
type SearchResult =
  | (User & { type: 'user' })
  | (Channel & { type: 'channel' })
  | (Message & { type: 'chatMessage' })
  | (Message & { type: 'channelMessage' })
  | (Answer & { type: 'answer' });

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe],
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
