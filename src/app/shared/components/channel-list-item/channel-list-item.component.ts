import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ChannelInterface } from '../../models/channel.interface'; // Importing the ChannelInterface for type safety
import { ActivatedRoute, RouterLink } from '@angular/router'; // Importing Angular's Router and RouterLink for navigation
import { CommonModule } from '@angular/common'; // Importing Angular's CommonModule for basic Angular functionality
import { MobileService } from '../../../services/mobile.service'; // Importing the MobileService to handle mobile-specific logic
import { ScreenService } from '../../../services/screen.service';
import { ScreenSize } from '../../types/screen-size.type';
import { Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { ConversationActiveRouterService } from '../../../services/conversation-active-router.service';

@Component({
  selector: 'app-channel-list-item', // Component selector for this item
  imports: [RouterLink, CommonModule], // Necessary imports for routing and common functionality
  templateUrl: './channel-list-item.component.html', // The component's template
  styleUrls: [
    './channel-list-item.component.scss', // Component-specific styles
    './../../../shared/styles/list-item.scss', // Shared list item styles
  ],
})
export class ChannelListItemComponent {
  screenSize$!: Observable<ScreenSize>;
  channelId!: string;

  constructor(
    public mobileService: MobileService, // Injecting MobileService for handling mobile-specific state\
    public screenService: ScreenService,
    private route: ActivatedRoute,
    private conversationActiveRouterService: ConversationActiveRouterService
  ) {
    this.screenSize$ = this.screenService.screenSize$;
  }

  /**
   * The channel whose information should be displayed.
   * This is passed from the parent component.
   */
  @Input() channel!: ChannelInterface;

  /** Flag indicating if this channel is related to a search result post */
  @Input() relatedToSearchResultPost: boolean = false;

  /** Flag indicating if the channel is in search results in the current post input */
  @Input() isInSearchResultsCurrentPostInput: boolean = false;

  /**
   * EventEmitter to notify the parent component when a channel is selected.
   */
  @Output() channelSelected = new EventEmitter<ChannelInterface>();

  @Input() isInChannelHeader = false;

  private destroy$ = new Subject<void>();

  active = false;

  ngOnInit() {
    this.conversationActiveRouterService
      .getConversationId$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => {
        this.active = this.channel.id === id;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Emits the selected channel via the channelSelected EventEmitter.
   * This is used to notify the parent component of the selected channel.
   */

  emitChannel() {
    this.channelSelected.emit(this.channel); // Emit the channel data to the parent component
  }

  truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
  }
}
