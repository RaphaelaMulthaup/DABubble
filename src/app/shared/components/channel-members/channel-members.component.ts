import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { UserInterface } from '../../models/user.interface';
import { UserService } from '../../../services/user.service';
import { ChannelInterface } from '../../models/channel.interface';
import { UserListItemComponent } from '../user-list-item/user-list-item.component';
import { OverlayService } from '../../../services/overlay.service';
import { AddMemberToChannelComponent } from '../../../overlay/add-member-to-channel/add-member-to-channel.component';
import { Subscription } from 'rxjs';

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
  memberIds?: string[];
  clickedAddMember: boolean = false;

  
  @Input()overlay:string = "";

  private userService = inject(UserService);
  private overlayService = inject(OverlayService);
  users$!: Observable<UserInterface[]>;
  private subscription: Subscription = new Subscription();

  ngOnInit() {
    const sub = this.channelDetails$!.subscribe((channel) => {
      this.memberIds = channel!.memberIds;
      this.users$ = this.userService.getMembersFromChannel(this.memberIds!);
    });
    this.subscription.add(sub);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
  openAddMemberToChannelOverlay(event: MouseEvent) {
    this.overlayService.openComponent(
      AddMemberToChannelComponent,
      'cdk-overlay-dark-backdrop',
      {
        origin: event.currentTarget as HTMLElement,
        originPosition: {
          originX: 'center',
          originY: 'bottom',
          overlayX: 'center',
          overlayY: 'top',
        },
        originPositionFallback: {
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom',
        },
      },
      {
        channelDetails$: this.channelDetails$ as Observable<ChannelInterface | undefined>,
      }
    );
  }
}
