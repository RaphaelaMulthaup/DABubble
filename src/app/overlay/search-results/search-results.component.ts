import { Component, Input } from '@angular/core';
import { SearchResult } from '../../shared/types/search-result.type';
import { UserListItemComponent } from '../../shared/components/user-list-item/user-list-item.component';
import { ChannelListItemComponent } from '../../shared/components/channel-list-item/channel-list-item.component';
import { PostListItemComponent } from '../../shared/components/post-list-item/post-list-item.component';

@Component({
  selector: 'app-search-results',
  imports: [
    UserListItemComponent,
    ChannelListItemComponent,
    PostListItemComponent,
  ],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss',
})
export class SearchResultsComponent {
  @Input() results$: any[] = [];
  @Input() searchTerm: string = '';
}
