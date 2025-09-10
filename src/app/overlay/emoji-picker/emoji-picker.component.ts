import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { EMOJIS } from '../../shared/constants/emojis';
import { OverlayService } from '../../services/overlay.service';

@Component({
  selector: 'app-emoji-picker',
  imports: [CommonModule],
  templateUrl: './emoji-picker.component.html',
  styleUrl: './emoji-picker.component.scss',
})
export class EmojiPickerComponent {
  senderIsCurrentUser!: boolean;
  emojis = EMOJIS;
  @Output() selectedEmoji = new EventEmitter<{ token: string; src: string; }>();

  constructor(private overlayService: OverlayService){}

  /**
   * This function uses the chosen emoji and the userId to react to a post
   */
  reactToPost(emoji: { token: string; src: string; }) {
    this.selectedEmoji.emit(emoji);
    this.overlayService.closeAll();
  }
}
