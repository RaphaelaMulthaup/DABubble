import { Component, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, startWith, map, Observable } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SearchService } from '../../../../services/search.service';
import { JsonPipe } from '@angular/common';
import { SearchResult } from '../../../../shared/types/search-result.type';
import { UserListItemComponent } from '../../../../shared/components/user-list-item/user-list-item.component';
import { ChannelListItemComponent } from '../../../../shared/components/channel-list-item/channel-list-item.component';
import { PostListItemComponent } from '../../../../shared/components/post-list-item/post-list-item.component';
import { UserInterface } from '../../../../shared/models/user.interface';
import { ChannelInterface } from '../../../../shared/models/channel.interface';
import { OverlayService } from '../../../../services/overlay.service';
import { SearchResultsComponent } from '../../../../overlay/search-results/search-results.component';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    JsonPipe,
    UserListItemComponent,
    ChannelListItemComponent,
    PostListItemComponent,
  ],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent {
  // Inject the SearchService to use it inside the component
  searchService = inject(SearchService);
  overlayService = inject(OverlayService);

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

  ngOnInit() {
    this.term$.subscribe((term) => {
      if (term.length > 0) {
        this.overlayService.close();
        const originElement = document.querySelector(
          '.input-wrapper'
        ) as HTMLElement;
        this.overlayService.openComponent(
          SearchResultsComponent,
          'cdk-overlay-transparent-backdrop',
          {
            origin: originElement,
            originPosition: {
              originX: 'center',
              originY: 'bottom',
              overlayX: 'start',
              overlayY: 'top',
            },
          },
          { results$: this.groupedResults() }
        );
      } else {
        this.overlayService.close(); // optional: Overlay schließen, wenn Eingabe leer
      }
    });
  }

  /***
   * Converts the search results Observable into a signal for template binding.
   * Explicitly typed as SearchResult[] to ensure strong typing.
   * Provides an initial empty array until results are received.
   */
  results = toSignal(
    this.searchService.search(this.term$) as Observable<SearchResult[]>,
    { initialValue: [] as SearchResult[] }
  );

  groupedResults = computed(() => {
    const res = this.results();

    const grouped: any[] = [];

    // Sammel-Map für chatMessages nach User
    const chatMap = new Map<string, { user: UserInterface; posts: any[] }>();

    // Sammel-Map für channelMessages nach Channel
    const channelMap = new Map<
      string,
      { channel: ChannelInterface; posts: any[] }
    >();

    for (const item of res) {
      if (item.type === 'chatMessage') {
        if (!item.user) continue;
        if (!chatMap.has(item.user.uid)) {
          chatMap.set(item.user.uid, { user: item.user, posts: [] });
        }
        chatMap.get(item.user.uid)!.posts.push(item);
      } else if (item.type === 'channelMessage') {
        const channelId = item.channelId!;
        if (!channelMap.has(channelId)) {
          channelMap.set(channelId, { channel: item.channel, posts: [] });
        }
        channelMap.get(channelId)!.posts.push(item);
      } else {
        grouped.push(item);
      }
    }

    // alle Chat-Gruppen anhängen
    for (const [, value] of chatMap) {
      grouped.push({
        type: 'chatGroup',
        user: value.user,
        posts: value.posts,
      });
    }

    // alle Channel-Gruppen anhängen
    for (const [, value] of channelMap) {
      grouped.push({
        type: 'channelGroup',
        channel: value.channel,
        posts: value.posts,
      });
    }

    return grouped;
  });
}
