import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChannelsService } from '../../../services/channels.service';
import { Observable } from 'rxjs';
import { ChannelInterface } from '../../../shared/models/channel.interface';
import { ScreenService } from '../../../services/screen.service';
import { ScreenSize } from '../../../shared/types/screen-size.type';

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
  screenSize$!: Observable<ScreenSize>;
  isEditActive: boolean = false;
  nameInput?: string;
  isNameTaken!: boolean;
  showErrorMessage: boolean = false;

  constructor(
    private channelService: ChannelsService,
    public screenService: ScreenService
  ) {
    this.screenSize$ = this.screenService.screenSize$;
  }

  /**
   * Changes Channel-name and throw error if name is allready in use 
   * 
   */
  async saveName(newName: string) {
    if (!this.channelId || !newName || newName.trim() === '') return;
    
    if(this.channel && newName.trim() === this.channel.name) {
      this.isEditActive = false;
      this.editActiveChange.emit(this.isEditActive);
      this.showErrorMessage = false;
      return;
    }

    let isAvailable = await this.channelService.checkNameTacken(newName).toPromise();

    if (isAvailable) {
      await this.channelService.changeChannelName(this.channelId, newName);
      
      if (this.channel) {
        this.channel.name = newName;
      }
      
      this.isEditActive = false;
      this.editActiveChange.emit(this.isEditActive);
      this.isNameTaken = false;
    } else {
      this.showErrorMessage = true;
      this.isNameTaken = true;
    }
  }

  /**
   * Disarms errorMessage on new inputfield interaction.
   */
  onInputChange() {
    this.showErrorMessage = false;
    this.isNameTaken = false;
  }

  toggleEdit() {
    this.isEditActive = !this.isEditActive;
    this.editActiveChange.emit(this.isEditActive);
    if (this.isEditActive && this.channel) {
      this.nameInput = this.channel.name;
    }
  }
}
