import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { EMOJIS } from '../../shared/constants/emojis';

@Component({
  selector: 'app-emoji-picker',
  imports: [CommonModule],
  templateUrl: './emoji-picker.component.html',
  styleUrl: './emoji-picker.component.scss',
})
export class EmojiPickerComponent {
  senderIsCurrentUser!: boolean;
  emojis = EMOJIS;
  @Output() selectedEmoji = new EventEmitter<string>();

  /**
   * This function uses the chosen emoji and the userId to react to a post
   */
  reactToPost(index: number) {
    this.selectedEmoji.emit(this.emojis[index].src);
  }
}
