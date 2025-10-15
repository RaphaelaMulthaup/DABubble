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
  @Output() selectedEmoji = new EventEmitter<{ token: string; src: string }>();
  emojis = EMOJIS;
  rightAngleTopRight!: boolean;
  rightAngleBottomLeft: boolean = false;

  constructor(private overlayService: OverlayService) {}

  /**
   * This function uses the chosen emoji and the userId to react to a post.
   * After that, all overlays are closed.
   * 
   * @param emoji - the emoji used to react to a post
   */
  reactToPost(emoji: { token: string; src: string }) {
    this.selectedEmoji.emit(emoji);
    this.overlayService.closeAll();
  }
}
