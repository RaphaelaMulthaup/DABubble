import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { UserInterface } from '../../../shared/models/user.interface';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-channel-members',
  imports: [CommonModule],
  templateUrl: './channel-members.component.html',
  styleUrl: './channel-members.component.scss'
})
export class ChannelMembersComponent {
@Input() memberIds?:string[];

private userService = inject(UserService);
users$?:Observable<UserInterface[]>;

ngOnInit(){
  this.users$ = this.userService.getMembersFromChannel(this.memberIds!);
}
}
