import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ChannelInterface } from '../../models/channel.interface';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MobileService } from '../../../services/mobile.service';
import { SearchService } from '../../../services/search.service';

@Component({
  selector: 'app-channel-list-item',
  imports: [RouterLink, CommonModule],
  templateUrl: './channel-list-item.component.html',
  styleUrls: [
    './channel-list-item.component.scss',
    './../../../shared/styles/list-item.scss',
  ],
})
export class ChannelListItemComponent {
  constructor(
    public mobileService: MobileService,
    private searchService: SearchService,
    private router: Router
  ) {}

  /** The channel whose information should be displayed. This is passed from the parent component. */
  @Input() channel!: ChannelInterface;
  @Input() relatedToSearchResultPost: boolean = false;
  @Input() inSearchResultsCurrentPostInput: boolean = false;
  @Output() channelSelected = new EventEmitter<ChannelInterface>();

  removeFocusAndHandleClick() {
    // Fokus sofort entfernen, bevor der Klick verarbeitet wird
    if (!this.inSearchResultsCurrentPostInput) {
      this.searchService.removeFocus();
      this.mobileService.setMobileDashboardState('message-window');
      this.router.navigate(['/dashboard', 'channel', this.channel.id]);
    }
  }

  emitChannel() {
    this.channelSelected.emit(this.channel);
  }
}
