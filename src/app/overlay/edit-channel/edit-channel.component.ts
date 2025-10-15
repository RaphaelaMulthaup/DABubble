import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../services/overlay.service';
import { ChannelInterface } from '../../shared/models/channel.interface';
import { filter, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { ChangeChannelNameComponent } from './change-channel-name/change-channel-name.component';
import { ChangeChannelDescriptionComponent } from './change-channel-description/change-channel-description.component';
import { ChannelMembersComponent } from '../../shared/components/channel-members/channel-members.component';
import { HeaderOverlayComponent } from '../../shared/components/header-overlay/header-overlay.component';
import { UserService } from '../../services/user.service';
import { UserInterface } from '../../shared/models/user.interface';
import { AuthService } from '../../services/auth.service';
import { ChannelsService } from '../../services/channels.service';
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
  channelDetails$!: Observable<ChannelInterface | undefined>;
  screenSize$!: Observable<ScreenSize>;
  user$?: Observable<UserInterface>;
  private destroy$ = new Subject<void>();

  memberIds?: string[];
  currentUser!: string;
  channelId?: string;
  channelName?: string;
  createdById?: string;
  editChannelName: boolean = false;
  editChannelDescription: boolean = false;

  constructor(
    private authService: AuthService,
    public channelService: ChannelsService,
    public overlayService: OverlayService,
    public screenService: ScreenService,
    private userService: UserService
  ) {
    let currentUser = this.authService.currentUser?.uid ?? null;
    if (currentUser) this.currentUser = currentUser;

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
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * This function toggles editChannelName.
   * Furthermore its executes the changeHeightOnFocus() function.
   *
   * @param isActive - whether editing is active or not
   */
  editName(isActive: boolean) {
    this.editChannelName = isActive;
    this.changeHeightOnFocus();
  }

  /**
   * This function toggles editChannelDescription.
   *
   * @param isActive - whether editing is active or not
   */
  editDescription(isActive: boolean) {
    this.editChannelDescription = isActive;
  }

  /**
   * Adds a class to the nameAndError-element.
   * This creates enough space for inputfield and error-message.
   */
  changeHeightOnFocus() {
    let nameAndError = document.querySelector('.nameAndError');
    nameAndError?.classList.add('nameAndErrorEdit');
  }
}
