import { Component, Input, inject } from '@angular/core';
import { CommonModule} from '@angular/common';
import { Observable } from 'rxjs';
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
  @Input() channel?:ChannelInterface;

private userService = inject(UserService);
users$?:Observable<UserInterface[]>;

  ngOnInit(){
    this.users$ = this.userService.getMembersFromChannel(this.channel!.memberIds);
  }
}
