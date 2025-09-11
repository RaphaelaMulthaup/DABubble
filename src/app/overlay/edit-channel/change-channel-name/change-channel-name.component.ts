import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChannelsService } from '../../../services/channels.service';
import { Observable } from 'rxjs';
import { ChannelInterface } from '../../../shared/models/channel.interface';

@Component({
  selector: 'app-change-channel-name',
  imports: [CommonModule, FormsModule],
  templateUrl: './change-channel-name.component.html',
  styleUrl: './change-channel-name.component.scss',
})
export class ChangeChannelNameComponent {
  @Input() channelId?: string;
  @Input() channel?: ChannelInterface;
  @Output() editActiveChange = new EventEmitter<boolean>();

  isEditActive: boolean = false;
  nameInput?: string;

  constructor(private channelService: ChannelsService) {}

  async saveName(newName: string) {
    this.channelService.changeChannelName(this.channelId!, newName);
    this.isEditActive = !this.isEditActive;
    this.editActiveChange.emit(this.isEditActive);
  }

  toggleEdit() {
    this.isEditActive = !this.isEditActive;
    this.editActiveChange.emit(this.isEditActive);
    if (this.isEditActive && this.channel) {
      this.nameInput = this.channel.name;
    }
  }
}
