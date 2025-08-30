import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-channel-members',
  imports: [],
  templateUrl: './channel-members.component.html',
  styleUrl: './channel-members.component.scss'
})
export class ChannelMembersComponent {
@Input() memberIds?:string[];
}
