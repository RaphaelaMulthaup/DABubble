import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { take } from 'rxjs';
import { OverlayService } from '../../services/overlay.service';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { PostService } from '../../services/post.service';
import { PostInterface } from '../../shared/models/post.interface';
import { AuthService } from '../../services/auth.service';
import { EditPostBtnComponent } from '../edit-post-btn/edit-post-btn.component';
import { EMOJIS } from '../../shared/constants/emojis';
import { ReactionsService } from '../../services/reactions.service';

@Component({
  selector: 'app-post-interaction-overlay',
  imports: [CommonModule],
  templateUrl: './post-interaction-overlay.component.html',
  styleUrl: './post-interaction-overlay.component.scss',
})
export class PostInteractionOverlayComponent implements OnInit {
  @Input() post!: PostInterface;
  emojis = EMOJIS;

  conversationWindowState?: 'conversation' | 'thread';
  currentConversationType!: 'channel' | 'chat';
  currentConversationId!: string;
  senderIsCurrentUser!: boolean;
  parentMessageId?: string; //the id of the message, an answer belongs to -> only if the message is an answer

  constructor(
    private authService: AuthService,
    public overlayService: OverlayService,
    public postService: PostService,
    private reactionsService: ReactionsService
  ) {}

  ngOnInit() {
    if (!this.post) return;
    this.senderIsCurrentUser =
      this.post.senderId === this.authService.currentUser?.uid;
  }

  /**
   * This function lets the user react quickly to a post by selecting on of the two preselected emojis.
   * The emoji that fits to the given token is used to react.
   *
   * @param emojiToken - The token of the chosen preselected emoji.
   */
  reactToPostWithPreselection(emojiToken: string) {
    let emoji = this.emojis.find((e) => e.token == emojiToken);
    if (this.parentMessageId) {
      this.reactionsService.toggleReaction(
        '/' + this.currentConversationType + 's/' + this.currentConversationId + '/messages/' + this.parentMessageId,
        'answers',
        this.post.id!,
        emoji!
      );
    } else {
      this.reactionsService.toggleReaction(
        '/' + this.currentConversationType + 's/' + this.currentConversationId,
        'messages',
        this.post.id!,
        emoji!
      );
    }
    this.overlayService.closeAll();
  }

  /**
   * This function opens the EmojiPicker-Overlay.
   * The overlay possibly emits an emoji and this emoji is used to react to the post.
   *
   * @param event - The user-interaction with an object.
   */
  async openEmojiPickerOverlay(event: MouseEvent) {
    const overlay = this.overlayService.openComponent(
      EmojiPickerComponent,
      'cdk-overlay-transparent-backdrop',
      {
        origin: event.currentTarget as HTMLElement,
        originPosition: await this.reactionsService.resolveEmojiPickerPosition(this.senderIsCurrentUser)
      },
      { rightAngleTopRight: await this.reactionsService.checkEmojiPickerPosition(this.senderIsCurrentUser)}
    );
    overlay!.ref.instance.selectedEmoji
      .pipe(take(1))
      .subscribe((emoji) => this.handleSelectedEmoji(emoji));
  }

  /**
   * This function uses the emitted emoji to react to a post.
   * After that, all overlays are closed.
   *
   * @param emoji - The selected emoji to react
   */
  handleSelectedEmoji(emoji: { token: string; src: string }) {
    const path = this.parentMessageId
      ? `/${this.currentConversationType}s/${this.currentConversationId}/messages/${this.parentMessageId}`
      : `/${this.currentConversationType}s/${this.currentConversationId}`;
    const subcollection = this.parentMessageId ? 'answers' : 'messages';
    this.reactionsService.toggleReaction(path, subcollection, this.post.id!, emoji);
    this.overlayService.closeAll();
  }

  /**
   * This functions opens the EditPostBtn-overlay.
   *
   * @param event the user-interaction with an object.
   */
  openEditPostBtnOverlay(event: MouseEvent) {
    this.overlayService.openComponent(
      EditPostBtnComponent,
      'cdk-overlay-transparent-backdrop',
      {
        origin: event.currentTarget as HTMLElement,
        originPosition: {
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
