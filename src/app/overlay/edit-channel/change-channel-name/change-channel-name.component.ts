import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Input() channel?: ChannelInterface;
  @Input() channelId?: string;
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
   * Changes the channel-name.
   *
   * @param newName - the new channel-name
   */
  async updateName(newName: string) {
    if (!this.channelId || !newName || newName.trim() === '') return;
    if (this.channel && newName.trim() === this.channel.name) return this.resetEditState();

    const isAvailable = await this.checkNameAvailability(newName);
    if (isAvailable) {
      await this.applyNewChannelName(newName);
    } else {
      this.showNameTakenError();
    }
  }

  /**
   * Resets the edit state after cancelling or keeping the same name
   */
  resetEditState() {
    this.isEditActive = false;
    this.editActiveChange.emit(this.isEditActive);
    this.showErrorMessage = false;
  }

  /**
   * Checks if the new channel-name is available.
   *
   * @param newName - the new channel-name
   */
  async checkNameAvailability(newName: string) {
    return await this.channelService
      .isChannelNameAvailable(newName)
      .toPromise();
  }

  /**
   * Applies the new name and updates UI state.
   *
   * @param newName - the new channel-name
   */
  async applyNewChannelName(newName: string) {
    await this.channelService.changeChannelName(this.channelId!, newName);
    if (this.channel) this.channel.name = newName;
    this.isEditActive = false;
    this.editActiveChange.emit(this.isEditActive);
    this.isNameTaken = false;
  }

  /**
   * Displays the 'name already taken' error.
   */
  showNameTakenError() {
    this.showErrorMessage = true;
    this.isNameTaken = true;
  }

  /**
   * Disarms errorMessage on new inputfield interaction.
   */
  onInputChange() {
    this.showErrorMessage = false;
    this.isNameTaken = false;
  }

  /**
   * Toggles the isEditActive-variable and emits its value.
   */
  toggleEdit() {
    this.isEditActive = !this.isEditActive;
    this.editActiveChange.emit(this.isEditActive);
    if (this.isEditActive && this.channel) this.nameInput = this.channel.name;
  }
}
