import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of, take } from 'rxjs';
import { OverlayService } from '../../services/overlay.service';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { PostService } from '../../services/post.service';
import { PostInterface } from '../../shared/models/post.interface';
import { AuthService } from '../../services/auth.service';
import { EditPostBtnComponent } from '../edit-post-btn/edit-post-btn.component';
import { MobileService } from '../../services/mobile.service';
import { OverlayRef } from '@angular/cdk/overlay';
import { EMOJIS } from '../../shared/constants/emojis';

@Component({
  selector: 'app-post-interaction-overlay',
  imports: [CommonModule],
  templateUrl: './post-interaction-overlay.component.html',
  styleUrl: './post-interaction-overlay.component.scss',
})
export class PostInteractionOverlayComponent implements OnInit {
  currentConversationType!: 'channel' | 'chat';
  currentConversationId!: string;
  @Input() post!: PostInterface;
  senderIsCurrentUser!: boolean;
  emojis = EMOJIS;
  parentMessageId?: string; //the id of the message, an answer belongs to -> only if the message is an answer

  constructor(
    private authService: AuthService,
    public overlayService: OverlayService,
    public postService: PostService,
    public mobileService: MobileService
  ) {}

  ngOnInit() {
    if (!this.post) return;
    this.senderIsCurrentUser =
      this.post.senderId === this.authService.currentUser.uid;
  }

  /**
   * This function lets the user react quickly to a post by selecting on of the two preselected emojis.
   * The emoji that fits to the given token is used to react.
   *
   * @param emojiToken the token of the chosen preselected emoji.
   */
  reactToPostWithPreselection(emojiToken: string) {
    let emoji = this.emojis.find((e) => e.token == emojiToken);

    if (this.parentMessageId) {
      this.postService.toggleReaction(
        '/' +
          this.currentConversationType +
          's/' +
          this.currentConversationId +
          '/messages/' +
          this.parentMessageId,
        'answers',
        this.post.id!,
        emoji!
      );
    } else {
      this.postService.toggleReaction(
        '/' + this.currentConversationType + 's/' + this.currentConversationId,
        'messages',
        this.post.id!,
        emoji!
      );
    }

    this.overlayService.closeAll();
  }

  /**
   * This function opens the emoji-picker overlay and transmits the isMessageFromCurrentUser-variable.
   * The overlay possibly emits an emoji and this emoji is used to react to the post.
   *
   * @param event the user-interaction with an object.
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
      { senderIsCurrentUser: this.senderIsCurrentUser }
    );

    //das abonniert den event emitter vom emoji-picker component
    overlay!.ref.instance.selectedEmoji
      .pipe(take(1))
      .subscribe((emoji: { token: string; src: string }) => {
        if (this.parentMessageId) {
          this.postService.toggleReaction(
            '/' +
              this.currentConversationType +
              's/' +
              this.currentConversationId +
              '/messages/' +
              this.parentMessageId,
            'answers',
            this.post.id!,
            emoji
          );
        } else {
          this.postService.toggleReaction(
            '/' +
              this.currentConversationType +
              's/' +
              this.currentConversationId,
            'messages',
            this.post.id!,
            emoji
          );
        }
        this.overlayService.closeAll();
      });
  }

  /**
   * This functions opens the edit-post-overlay.
   *
   * @param event the user-interaction with an object.
   */
  openEditPostBtnOverlay(event: MouseEvent) {
    const overlay = this.overlayService.openComponent(
      EditPostBtnComponent,
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
