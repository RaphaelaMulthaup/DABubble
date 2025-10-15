import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Input() channel?: ChannelInterface;
  @Input() channelId?: string;
  @Input() user$?: Observable<UserInterface>;
  @Output() editActiveChange = new EventEmitter<boolean>();

  screenSize$!: Observable<ScreenSize>;
  isEditActive: boolean = false;
  descriptionInput?: string;

  constructor(
    private channelService: ChannelsService,
    public screenService: ScreenService
  ) {
    this.screenSize$ = this.screenService.screenSize$;
  }

  /**
   * Changes the channel-description.
   *
   * @param newDescription - the new channel-description
   */
  async updateDescription(newDescription: string) {
    if (!this.channelId || !this.channel) return;
    await this.channelService.changeChannelDescription(
      this.channelId,
      newDescription
    );
    this.channel.description = newDescription;
    this.isEditActive = false;
    this.editActiveChange.emit(this.isEditActive);
  }

  /**
   * Toggles the isEditActive-variable and emits its value.
   */
  toggleEdit() {
    this.isEditActive = !this.isEditActive;
    this.editActiveChange.emit(this.isEditActive);
    if (this.isEditActive && this.channel) this.descriptionInput = this.channel.description;
  }
}
