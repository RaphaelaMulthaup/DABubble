import { Component, inject, WritableSignal } from '@angular/core';
import { ChannelsService } from '../../../../services/channels.service';
import { Observable } from 'rxjs';
import { ChannelInterface } from '../../../../shared/models/channel.interface';
import { AsyncPipe } from '@angular/common';
import { ChannelSelectionService } from '../../../../services/channel-selection.service';
import { AuthService } from '../../../../services/auth.service';
import { CreateChannelFormComponent } from '../../../../overlay/create-channel-form/create-channel-form.component';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../../services/user.service';
import { OverlayService } from '../../../../services/overlay.service';
import { ChannelListItemComponent } from '../../../../shared/components/channel-list-item/channel-list-item.component';
import { MobileService } from '../../../../services/mobile.service';
import { MobileDashboardState } from '../../../../shared/types/mobile-dashboard-state.type';

@Component({
  selector: 'app-channel-list',
  imports: [AsyncPipe, CreateChannelFormComponent, RouterLink, ChannelListItemComponent],
  templateUrl: './channel-list.component.html',
  styleUrl: './channel-list.component.scss',
})
export class ChannelListComponent {
  // Boolean to control the visibility of the popup form
  showPopup = false;

  //With this variable show/hide channels from sidenav
  showChannels: boolean = false;

  // Observable list of active channels for the current user
  channels$!: Observable<ChannelInterface[]>;
  // Observable list of deleted channels
  deletedChannels$!: Observable<ChannelInterface[]>;
  // Currently selected channel
  selectedChannel: ChannelInterface | null = null;
  // ID of the currently logged-in user
  currentUserId!: string | null;

  public mobileService = inject(MobileService);

  mobileDashboardState: WritableSignal<MobileDashboardState> = this.mobileService.mobileDashboardState;

  // Services injected via Angular's DI system
  private channelSelectionService = inject(ChannelSelectionService);
  private channnelsService = inject(ChannelsService);
  private authService = inject(AuthService);
  private overlayService = inject(OverlayService);
  constructor() {}

  /**
   * Lifecycle hook that initializes component data
   * - Gets the current user ID
   * - Fetches the channels of the current user
   * - Fetches all deleted channels
   */
  ngOnInit() {
    this.currentUserId = this.authService.getCurrentUserId();
    this.channels$ = this.channnelsService.getCurrentUserChannels();
    this.deletedChannels$ = this.channnelsService.getAllDeletedChannels();
  }

  /**
   * Selects a channel using the ChannelSelectionService
   * @param channel The channel to select
   */
  selectChannel(channel: ChannelInterface) {
    this.channelSelectionService.selectChannel(channel);
  }

 displayCreateChannelForm() {
    this.overlayService.displayOverlay(
      CreateChannelFormComponent,
      'Channel erstellen',
      {}
    );
  }

  hideOverlay(){
    this.overlayService.hideOverlay();
  }


  /**
   * Deletes a channel by its ID
   * @param channel The channel to delete
   * Displays an alert on success or failure
   */
  deleteChannel(channel: ChannelInterface) {
    console.log('Deleting channel:', channel.id);
    this.channnelsService.deleteChannel(channel.id!).subscribe({
      next: () => {
        alert('Channel deleted successfully!');
      },
      error: (error) => {
        console.error('Error deleting channel:', error);
        alert('Failed to delete channel. Please try again later.');
      },
    });
  }

  /**
   * Adds a channel by its ID
   * @param channel The channel to add
   * Displays an alert on success or failure
   */
  addChannel(channel: ChannelInterface) {
    console.log('Adding channel:', channel);
    this.channnelsService.addChannel(channel.id!).subscribe({
      next: () => {
        alert('Channel added successfully!');
      },
      error: (error) => {
        console.error('Error adding channel:', error);
        alert('Failed to add channel. Please try again later.');
      },
    });
  }
}
