import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil } from 'rxjs';
import { UserInterface } from '../../models/user.interface';
import { UserService } from '../../../services/user.service';
import { ChannelInterface } from '../../models/channel.interface';
import { UserListItemComponent } from '../user-list-item/user-list-item.component';
import { OverlayService } from '../../../services/overlay.service';
import { AddMemberToChannelComponent } from '../../../overlay/add-member-to-channel/add-member-to-channel.component';
import { OverlayRef } from '@angular/cdk/overlay';
import { ScreenSize } from '../../types/screen-size.type';
import { ScreenService } from '../../../services/screen.service';
import { OverlayPositionInterface } from '../../models/overlay.position.interface';

@Component({
  selector: 'app-channel-members',
  imports: [CommonModule, UserListItemComponent, AddMemberToChannelComponent],
  templateUrl: './channel-members.component.html',
  styleUrls: [
    './channel-members.component.scss',
    './../../../shared/styles/list-item.scss',
  ],
})
export class ChannelMembersComponent implements OnDestroy, OnInit {
  @Input() channelDetails$?: Observable<ChannelInterface | undefined>;
  @Input() overlay: string = '';
  @Input() onBottom: boolean = false;

  screenSize$!: Observable<ScreenSize>;
  users$!: Observable<UserInterface[]>;
  private destroy$ = new Subject<void>();

  memberIds?: string[];
  clickedFromHeader: boolean = false;
  clickedAddMember: boolean = false;

  constructor(
    public screenService: ScreenService,
    private userService: UserService,
    private overlayService: OverlayService
  ) {
    this.screenSize$ = this.screenService.screenSize$;
  }

  ngOnInit() {
    this.channelDetails$!.pipe(takeUntil(this.destroy$)).subscribe(
      (channel) => {
        this.memberIds = channel!.memberIds;
        this.users$ = this.userService.getMembersFromChannel(this.memberIds!);
      }
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Determines the action based on where the click originated:
   * - If the click came from the header, sets `clickedAddMember` to true.
   * - Otherwise, opens the "Add Member to Channel" overlay at the click event position.
   *
   * @param event - The mouse event that triggered the action.
   */
  choiceBetweenComponentAndHeader(event: MouseEvent) {
    if (this.clickedFromHeader) {
      this.clickedAddMember = true;
    } else {
      this.openAddMemberToChannelOverlay(event);
    }
  }

  /**
   * Opens the add AddMemberToChannel-Overlay.
   * Its position depends on whether the onBottom-variable is true or false.
   *
   * @param event - The mouse event that triggered the action.
   */
  openAddMemberToChannelOverlay(event: MouseEvent) {
    let overlay;
    let positionStrategy: OverlayPositionInterface = this.onBottom
      ? this.returnOverlayBottomPosition()
      : this.returnOverlayOriginPosition(event);
    overlay = this.overlayService.openComponent(
      AddMemberToChannelComponent,
      'cdk-overlay-dark-backdrop',
      positionStrategy,
      {
        channelDetails$: this.channelDetails$ as Observable< ChannelInterface | undefined >,
        overlay: 'overlay',
        onBottom: this.onBottom,
      }
    );
    overlay!.ref.instance.overlayRef = overlay?.overlayRef as OverlayRef;
  }

  /**
   * returns the positionStrategy for the overlay if its placed on the bottom.
   */
  returnOverlayBottomPosition(): OverlayPositionInterface {
    return {
      globalPosition: 'bottom',
    };
  }

  /**
   * returns the positionStrategy for the overlay if its placed connected to an origin.
   *
   * @param event - The mouse event that triggered the action.
   */
  returnOverlayOriginPosition(event: MouseEvent): OverlayPositionInterface {
    return {
      origin: event.currentTarget as HTMLElement,
      originPosition: {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'end',
        overlayY: 'top',
      },
    };
  }
}
