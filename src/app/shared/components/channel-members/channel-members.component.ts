import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { UserInterface } from '../../models/user.interface';
import { UserService } from '../../../services/user.service';
import { ContactListItemComponent } from '../contact-list-item/contact-list-item.component';
import { ChannelInterface } from '../../models/channel.interface';

@Component({
  selector: 'app-channel-members',
  imports: [CommonModule, ContactListItemComponent ],
  templateUrl: './channel-members.component.html',
  styleUrls: ['./channel-members.component.scss', './../../../shared/styles/list-item.scss']

})
export class ChannelMembersComponent {
  @Input() channelDetails$?: Observable<ChannelInterface | undefined>;  
  memberIds?:string[];

private userService = inject(UserService);
users$!:Observable<UserInterface[]>;



ngOnInit(){
  // this.users$ = this.userService.getMembersFromChannel(this.memberIds!);
  this.channelDetails$!.subscribe(channel => {
        this.memberIds = channel!.memberIds;
        this.users$ = this.userService.getMembersFromChannel(this.memberIds!);
    });
  }  
}
