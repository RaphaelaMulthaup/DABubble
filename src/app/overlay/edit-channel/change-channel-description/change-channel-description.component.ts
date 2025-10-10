import { Component, EventEmitter, Input, Output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelsService } from '../../../services/channels.service';
import { FormsModule } from '@angular/forms';
import { ChannelInterface } from '../../../shared/models/channel.interface';
import { Observable } from 'rxjs';
import { UserInterface } from '../../../shared/models/user.interface';
import { UserListItemComponent } from '../../../shared/components/user-list-item/user-list-item.component';
import { ScreenSize } from '../../../shared/types/screen-size.type';
import { ScreenService } from '../../../services/screen.service';

@Component({
  selector: 'app-change-channel-description',
  imports: [CommonModule, FormsModule, UserListItemComponent],
  templateUrl: './change-channel-description.component.html',
  styleUrl: './change-channel-description.component.scss',
})
export class ChangeChannelDescriptionComponent {
  @Input() channelId?: string;
  @Input() user$?: Observable<UserInterface>;

  @Input() channel?: ChannelInterface;
  @Output() editActiveChange = new EventEmitter<boolean>();
  isEditActive: boolean = false;
  descriptionInput?: string;
  screenSize$!: Observable<ScreenSize>;

  constructor(
    private channelService: ChannelsService,
    public screenService: ScreenService
  ) {
    this.screenSize$ = this.screenService.screenSize$;
  }

  async saveDescription(newDescription: string) {
    if (!this.channelId || !this.channel) return;

    await this.channelService.changeChannelDescription(this.channelId, newDescription);
    this.channel.description = newDescription;
    this.isEditActive = false;
    this.editActiveChange.emit(this.isEditActive);
  }

  toggleEdit() {
    this.isEditActive = !this.isEditActive;
    this.editActiveChange.emit(this.isEditActive);

    if (this.isEditActive && this.channel) {
      this.descriptionInput = this.channel.description;
    }
  }
}
