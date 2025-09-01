import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../services/overlay.service';
import { ChannelInterface } from '../../shared/models/channel.interface';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-edit-channel',
  imports: [CommonModule],
  templateUrl: './edit-channel.component.html',
  styleUrl: './edit-channel.component.scss'
})
export class EditChannelComponent {
  public overlayService = inject(OverlayService);
  channelDetails$ = this.overlayService.overlayInputs as Observable<ChannelInterface>;;
}
