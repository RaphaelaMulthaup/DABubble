import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil } from 'rxjs';
import { UserInterface } from '../../models/user.interface';
import { UserService } from '../../../services/user.service';
import { ChannelInterface } from '../../models/channel.interface';
import { UserListItemComponent } from '../user-list-item/user-list-item.component';
import { OverlayService } from '../../../services/overlay.service';
import { AddMemberToChannelComponent } from '../../../overlay/add-member-to-channel/add-member-to-channel.component';
import { Subscription } from 'rxjs';
import { MobileService } from '../../../services/mobile.service';

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
  memberIds?: string[];
  clickedFromHeader: boolean = false;
  clickedAddMember: boolean = false;
  isMobile = false;
  users$!: Observable<UserInterface[]>;
  private updateMobile: () => void;
  private destroy$ = new Subject<void>();

  constructor(
    private mobileService: MobileService,
    private userService: UserService,
    private overlayService: OverlayService
  ) {
    this.updateMobile = () => {
      this.isMobile = this.mobileService.isMobile();
    };
    this.isMobile = this.mobileService.isMobile();
  }

  ngOnInit() {
    this.channelDetails$!.pipe(takeUntil(this.destroy$)).subscribe(
      (channel) => {
        this.memberIds = channel!.memberIds;
        this.users$ = this.userService.getMembersFromChannel(this.memberIds!);
      }
    );
    window.addEventListener('resize', this.updateMobile);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', this.updateMobile);
  }

  choiseBetweenComponentAndHeader(event: MouseEvent){
    if(this.clickedFromHeader){
      this.clickedAddMember = true;
    }else{
      this.openAddMemberToChannelOverlay(event);
    }
  }

  openAddMemberToChannelOverlay(event: MouseEvent) {
   if(this.onBottom){
     this.overlayService.openComponent(
      AddMemberToChannelComponent,
      'cdk-overlay-dark-backdrop',
      {
        globalPosition: 'bottom',
      },
      {
        channelDetails$: this.channelDetails$ as Observable<
          ChannelInterface | undefined
        >,
        overlay: 'overlay',
      }
    );
   }else{
       this.overlayService.openComponent(
      AddMemberToChannelComponent,
      'cdk-overlay-dark-backdrop',
      {
        origin: event.currentTarget as HTMLElement,
        originPosition: {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
        },
      },
      {
        channelDetails$: this.channelDetails$ as Observable<
          ChannelInterface | undefined
        >,
        overlay: 'overlay',
      }
    );
   }
  }
}




