import { Component, Input } from '@angular/core';
import { SearchResult } from '../../shared/types/search-result.type';
import { UserListItemComponent } from '../../shared/components/user-list-item/user-list-item.component';
import { ChannelListItemComponent } from '../../shared/components/channel-list-item/channel-list-item.component';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-search-results-new-message',
  imports: [UserListItemComponent, ChannelListItemComponent, JsonPipe],
  templateUrl: './search-results-new-message.component.html',
  styleUrl: './search-results-new-message.component.scss'
})
export class SearchResultsNewMessageComponent {
 @Input() results: SearchResult[] = [];
}
