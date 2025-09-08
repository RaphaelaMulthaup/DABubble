import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of, take } from 'rxjs';
import { OverlayService } from '../../services/overlay.service';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { PostService } from '../../services/post.service';
import { PostInterface } from '../../shared/models/post.interface';
import { AuthService } from '../../services/auth.service';
import { EditPostOverlayComponent } from '../edit-post/edit-post.component';
import { MobileService } from '../../services/mobile.service';

@Component({
  selector: 'app-post-interaction-overlay',
  imports: [CommonModule],
  templateUrl: './post-interaction-overlay.component.html',
  styleUrl: './post-interaction-overlay.component.scss',
})
export class PostInteractionOverlayComponent {
  currentConversationType!: 'channel' | 'chat';
  currentConversationId!: string;
  post!: PostInterface;
  senderIsCurrentUser$!: Observable<boolean>;

  constructor(
    private authService: AuthService,
    public overlayService: OverlayService,
    public postService: PostService,
    public mobileService: MobileService
  ) {
    this.senderIsCurrentUser$ = of(
      this.post.senderId === this.authService.currentUser.uid
    );
  }


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
        originPosition: {
          originX: 'center',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
        },
        originPositionFallback: {
          originX: 'center',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
        },
      },
      { senderIsCurrentUser$: this.senderIsCurrentUser$ }
    );

    //das abonniert den event emitter vom emoji-picker component
    overlay!.ref.instance.selectedEmoji
      .pipe(take(1))
      .subscribe((emoji: string) => {
        this.postService.toggleReaction(
          '/' +
            this.currentConversationType +
            's/' +
            this.currentConversationId,
          'messages',
          this.post.id!,
          emoji
        );
        this.overlayService.close();
      });
  }

  /**
   * This functions opens the edit-post-overlay.
   */
  openEditPostOverlay(event: MouseEvent) {
    const overlay = this.overlayService.openComponent(
      EditPostOverlayComponent,
      'cdk-overlay-transparent-backdrop',
      {
        origin: event.currentTarget as HTMLElement,
        originPosition: {
          originX: 'center',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
        },
        originPositionFallback: {
          originX: 'center',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
        },
      },
      { post: this.post }
    );
  }
}
