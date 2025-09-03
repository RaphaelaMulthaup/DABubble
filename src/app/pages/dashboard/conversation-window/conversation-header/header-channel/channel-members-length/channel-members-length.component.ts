import { Component, Input, inject } from '@angular/core';
import { CommonModule} from '@angular/common';
import { catchError, filter, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { ChannelInterface } from '../../../../../../shared/models/channel.interface';
import { UserInterface } from '../../../../../../shared/models/user.interface';
import { UserService } from '../../../../../../services/user.service';

@Component({
  selector: 'app-channel-members-length',
  imports: [CommonModule],
  templateUrl: './channel-members-length.component.html',
  styleUrls: ['./channel-members-length.component.scss', './../../../../../../shared/styles/list-item.scss']
})
export class ChannelMembersLengthComponent {
  private destroy$ = new Subject<void>();
  @Input() channel$!:Observable<ChannelInterface | undefined>;

    userService = inject(UserService);
  users$?:Observable<UserInterface[]>;

  channelWithUsers$!: Observable<{ channel: ChannelInterface | undefined; users: UserInterface[] }>;


  ngOnInit() {
    if (this.channel$) {
      this.channelWithUsers$ = this.channel$.pipe(
        filter(channel => !!channel?.memberIds),
        switchMap(channel => {
          const users$ = this.userService.getMembersFromChannel(channel!.memberIds!);
          return users$.pipe(
            catchError(() => of([] as UserInterface[])),
            switchMap(users => of({ channel, users }))
          );
        }),
        catchError(() => of({ channel: undefined, users: [] })),
        takeUntil(this.destroy$)
      );
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
