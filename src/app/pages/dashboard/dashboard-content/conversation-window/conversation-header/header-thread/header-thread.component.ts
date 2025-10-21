import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ScreenService } from '../../../../../../services/screen.service';
import { ScreenSize } from '../../../../../../shared/types/screen-size.type';
import { Router } from '@angular/router';
import { ChannelsService } from '../../../../../../services/channels.service';
import { ChannelInterface } from '../../../../../../shared/models/channel.interface';

@Component({
  selector: 'app-header-thread',
  imports: [CommonModule],
  templateUrl: './header-thread.component.html',
  styleUrl: './header-thread.component.scss',
})
export class HeaderThreadComponent {
  @Input() conversationType!: string;
  @Input() conversationId!: string;
  screenSize$!: Observable<ScreenSize>;
  channelDetails$!: Observable<ChannelInterface | undefined>;

  constructor(
    private channelService: ChannelsService,
    private router: Router,
    private screenService: ScreenService
  ) {
    this.screenSize$ = this.screenService.screenSize$;
  }

  ngOnInit() {
    this.channelDetails$ = this.channelService.getCurrentChannel(this.conversationId);
  }

  /**
   * Redirects the user to a specific conversation based on the conversation type and ID.
   *
   * @param conversationType - Type of the conversation (e.g., 'chat', 'channel')
   * @param id - ID of the conversation to redirect to
   */
  redirectTo(conversationType: string, id: string) {
    this.screenService.setDashboardState('message-window');
    this.router.navigate(['/dashboard', conversationType, id]);
  }
}
