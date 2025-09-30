import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, switchMap } from 'rxjs';
import { ScreenService } from '../../../../../services/screen.service';
import { ScreenSize } from '../../../../../shared/types/screen-size.type';
import { Router } from '@angular/router';
import { ChannelsService } from '../../../../../services/channels.service';
import { ChannelInterface } from '../../../../../shared/models/channel.interface';
import { MobileService } from '../../../../../services/mobile.service';

@Component({
  selector: 'app-header-thread',
  imports: [CommonModule],
  templateUrl: './header-thread.component.html',
  styleUrl: './header-thread.component.scss',
})
export class HeaderThreadComponent {
  screenSize$!: Observable<ScreenSize>;
  @Input() conversationType!: string;
  @Input() conversationId!: string;

  channelDetails$!: Observable<ChannelInterface | undefined>;

  constructor(
    private screenService: ScreenService,
    private router: Router, // Angular router service to navigate between routes
    private channelService: ChannelsService,
    private mobileService: MobileService // Service to manage mobile dashboard state
  ) {
    this.screenSize$ = this.screenService.screenSize$;
  }

  ngOnInit() {
    this.channelDetails$ = this.channelService.getCurrentChannel(
      this.conversationId
    );
  }

  redirectTo(conversationType: string, id: string) {
    this.screenService.setMobileDashboardState('message-window');
    this.router.navigate(['/dashboard', conversationType, id]); // Navigate to the specified conversation
  }
}
