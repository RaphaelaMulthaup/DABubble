import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-emoji-picker',
  imports: [CommonModule],
  templateUrl: './emoji-picker.component.html',
  styleUrl: './emoji-picker.component.scss'
})
export class EmojiPickerComponent {
  emojis = [
    'assets/img/emojis/grinning-face.svg',
    'assets/img/emojis/beaming-face.svg',
    'assets/img/emojis/face-with-tears-of-joy.svg',
    'assets/img/emojis/upside-down-face.svg',
    'assets/img/emojis/winking-face.svg',
    'assets/img/emojis/smiling-face-with-halo.svg',
    'assets/img/emojis/smiling-face-with-hearts.svg',
    'assets/img/emojis/smiling-face-with-heart-eyes.svg',
    'assets/img/emojis/face-blowing-a-kiss.svg',
    'assets/img/emojis/star-struck.svg',
    'assets/img/emojis/face-savoring-food.svg',
    'assets/img/emojis/smiling-face-with-open-hands.svg',
    'assets/img/emojis/face-with-peeking-eye.svg',
    'assets/img/emojis/shushing-face.svg',
    'assets/img/emojis/thinking-face.svg',
    'assets/img/emojis/saluting-face.svg',
    'assets/img/emojis/zipper-mouth-face.svg',
    'assets/img/emojis/neutral-face.svg',
    'assets/img/emojis/face-with-rolling-eyes.svg',
    'assets/img/emojis/relieved-face.svg',
    'assets/img/emojis/sleeping-face.svg',
    'assets/img/emojis/nauseated-face.svg',
    'assets/img/emojis/sneezing-face.svg',
    'assets/img/emojis/face-with-spiral-eyes.svg',
    'assets/img/emojis/exploding-head.svg',
    'assets/img/emojis/partying-face.svg',
    'assets/img/emojis/smiling-face-with-sunglasses.svg',
    'assets/img/emojis/slightly-frowning-face.svg',
    'assets/img/emojis/hushed-face.svg',
    'assets/img/emojis/face-holding-back-tears.svg',
    'assets/img/emojis/fearful-face.svg',
    'assets/img/emojis/sad-but-relieved-face.svg',
    'assets/img/emojis/loudly-crying-face.svg',
    'assets/img/emojis/angry-face.svg',
    'assets/img/emojis/skull.svg',
    'assets/img/emojis/pile-of-poop.svg',
    'assets/img/emojis/clown-face.svg',
    'assets/img/emojis/heart.svg',
    'assets/img/emojis/star.svg',
    'assets/img/emojis/waving-hand.svg',
    'assets/img/emojis/raised-hand.svg',
    'assets/img/emojis/ok-hand.svg',
    'assets/img/emojis/index-pointing-up.svg',
    'assets/img/emojis/thumbs-up.svg',
    'assets/img/emojis/thumbs-down.svg',
    'assets/img/emojis/clapping-hands.svg',
    'assets/img/emojis/handshake.svg',
    'assets/img/emojis/folded-hands.svg',
    'assets/img/emojis/flexed-biceps.svg',
    'assets/img/emojis/question-mark.svg',
    'assets/img/emojis/exclamation-mark.svg',
    'assets/img/emojis/check-mark.svg',
    'assets/img/emojis/cross-mark.svg',
  ]

  senderIsCurrentUser!: boolean;

  @Output() selectedEmoji = new EventEmitter<string>();

  /**
  * This function uses the chosen emoji and the userId to react to a post
  */
  reactToPost(index: number) { 
    this.selectedEmoji.emit(this.emojis[index]);
  }
}
