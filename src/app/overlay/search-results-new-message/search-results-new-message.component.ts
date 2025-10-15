import { Component, Input, Signal } from '@angular/core';
import { SearchResult } from '../../shared/types/search-result.type';
import { UserListItemComponent } from '../../shared/components/user-list-item/user-list-item.component';
import { ChannelListItemComponent } from '../../shared/components/channel-list-item/channel-list-item.component';
import { CommonModule, JsonPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { ScreenService } from '../../services/screen.service';
import { ScreenSize } from '../../shared/types/screen-size.type';

@Component({
  selector: 'app-search-results-new-message',
  imports: [
    UserListItemComponent,
    ChannelListItemComponent,
    JsonPipe,
    CommonModule,
  ],
  templateUrl: './search-results-new-message.component.html',
  styleUrl: './search-results-new-message.component.scss',
})
export class SearchResultsNewMessageComponent {
  @Input() results!: Signal<SearchResult[]>;
  screenSize$!: Observable<ScreenSize>;

  constructor(public screenService: ScreenService) {
    this.screenSize$ = this.screenService.screenSize$;
  }
}
