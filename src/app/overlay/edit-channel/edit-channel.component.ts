import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../services/overlay.service';
import { ChannelInterface } from '../../shared/models/channel.interface';
import { filter, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { ChangeChannelNameComponent } from './change-channel-name/change-channel-name.component';
import { ChangeChannelDescriptionComponent } from './change-channel-description/change-channel-description.component';
import { ChannelMembersComponent } from '../../shared/components/channel-members/channel-members.component';
import { HeaderOverlayComponent } from '../../shared/components/header-overlay/header-overlay.component';
import { UserService } from '../../services/user.service';
import { ChatInterface } from '../../shared/models/chat.interface';
import { UserInterface } from '../../shared/models/user.interface';
import { AuthService } from '../../services/auth.service';
import { ChannelsService } from '../../services/channels.service';
import { MobileService } from '../../services/mobile.service';
import { ScreenService } from '../../services/screen.service';
import { ScreenSize } from '../../shared/types/screen-size.type';

@Component({
  selector: 'app-edit-channel',
  imports: [
    CommonModule,
    ChangeChannelNameComponent,
    ChangeChannelDescriptionComponent,
    ChannelMembersComponent,
    HeaderOverlayComponent,
  ],
  templateUrl: './edit-channel.component.html',
  styleUrl: './edit-channel.component.scss',
})
export class EditChannelComponent {
  currentUser!: string;
  channelId?: string;
  channelName?: string;
  memberIds?: string[];
  createdById?: string;
  user$?: Observable<UserInterface>;
  editChannelName: boolean = false;
  editChannelDescription: boolean = false;
  screenSize$!: Observable<ScreenSize>;

  // CORECT: Inițializare corectă a observabilului
  channelDetails$!: Observable<ChannelInterface | undefined>;
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private mobileService: MobileService,
    public channelService: ChannelsService,
    public overlayService: OverlayService,
    public screenService: ScreenService
  ) {
    let currentUser = this.authService.currentUser?.uid ?? null;
    if (currentUser) {
      this.currentUser = currentUser;
    }
    this.channelDetails$ = this.overlayService.overlayInput.pipe(
      switchMap((data) => data?.channel ?? of(null)),
      filter((channel): channel is ChannelInterface => !!channel)
    );
    this.screenSize$ = this.screenService.screenSize$;
  }

  ngOnInit() {
    this.channelDetails$!.pipe(takeUntil(this.destroy$)).subscribe(
      (channel) => {
        if (channel) {
          this.createdById = channel.createdBy;
          this.channelId = channel.id;
          this.memberIds = channel.memberIds;
          this.channelName = channel.name;
          this.user$ = this.userService.getUserById(this.createdById);
        }
      }
    );
    // window.addEventListener('resize', this.updateMobile);
  }

  ngOnDestroy() {
    // window.removeEventListener('resize', this.updateMobile);
    this.destroy$.next();
    this.destroy$.complete();
  }

  editName(isActive: boolean) {
    this.editChannelName = isActive;
    this.changeHightOnFocus();
  }

  editDescription(isActive: boolean) {
    this.editChannelDescription = isActive;
  }

  /**
   * Changes hight on focus and creates enough space for inputfield and errer-message.
   */
  changeHightOnFocus() {
    let nameAndError = document.querySelector('.nameAndError');
    nameAndError?.classList.add('nameAndErrorEdit');
  }
}
