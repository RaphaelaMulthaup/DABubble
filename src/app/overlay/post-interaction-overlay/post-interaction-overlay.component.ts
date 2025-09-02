import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { OverlayService } from '../../services/overlay.service';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-post-interaction-overlay',
  imports: [CommonModule],
  templateUrl: './post-interaction-overlay.component.html',
  styleUrl: './post-interaction-overlay.component.scss'
})
export class PostInteractionOverlayComponent {
  public overlayService = inject(OverlayService);
  public postService = inject(PostService);

  currentType!: string;
  currentChannelId!: string;
  postId!: string;
  senderIsCurrentUser$!: Observable<boolean>;

  /**
   * This functions opens the emoji-picker overlay and transmits the isMessageFromCurrentUser-variable.
   * The overlay possibly emits an emoji and this emoji is used to react to the post.
   */
  openEmojiPickerOverlay(event: MouseEvent) {
    const overlay = this.overlayService.openComponent(
      EmojiPickerComponent,
      'cdk-overlay-transparent-backdrop',
      {
        origin: event.currentTarget as HTMLElement,
        originPosition: { originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'top' },
        originPositionFallback: { originX: 'start', originY: 'top', overlayX: 'end', overlayY: 'top' }
      },
      { senderIsCurrentUser$: this.senderIsCurrentUser$ }
    );

    //das abonniert den event emitter vom emoji-picker component
    overlay!.ref.instance.selectedEmoji.subscribe((emoji: string) => {
      this.postService.toggleReaction(
        '/' + this.currentType + 's/' + this.currentChannelId,
        'messages',
        this.postId!,
        emoji
      )
      this.overlayService.close();
    });
  }
}
