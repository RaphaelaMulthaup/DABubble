import { Component, Input } from '@angular/core';
import { HeaderOverlayComponent } from '../../shared/components/header-overlay/header-overlay.component';
import { ChannelInterface } from '../../shared/models/channel.interface';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-member-to-channel',
  imports: [HeaderOverlayComponent, CommonModule],
  templateUrl: './add-member-to-channel.component.html',
  styleUrl: './add-member-to-channel.component.scss',
})
export class AddMemberToChannelComponent {
  @Input() channelDetails$?: Observable<ChannelInterface | undefined>;
}
