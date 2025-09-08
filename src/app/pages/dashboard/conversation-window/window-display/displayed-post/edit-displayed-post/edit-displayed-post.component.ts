import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { PostInterface } from '../../../../../../shared/models/post.interface';
import { ChatActiveRouterService } from '../../../../../../services/chat-active-router.service';
import { ActivatedRoute } from '@angular/router';
import { PostService } from '../../../../../../services/post.service';
import { OverlayService } from '../../../../../../services/overlay.service';

@Component({
  selector: 'app-edit-displayed-post',
  imports: [],
  templateUrl: './edit-displayed-post.component.html',
  styleUrl: './edit-displayed-post.component.scss',
})
export class EditDisplayedPostComponent {
  chatActiveRouterService = inject(ChatActiveRouterService);
  route = inject(ActivatedRoute);
  postService = inject(PostService);
  overlayService = inject(OverlayService);

  @Input() post!: PostInterface;
  @Output() endEditingPost = new EventEmitter<void>();

  currentConversationType!: 'channel' | 'chat';
  currentConversationId!: string;
  messageId!: string;

  constructor() {
    this.chatActiveRouterService
      .getParams$(this.route)
      .subscribe(({ conversationType, conversationId }) => {
        this.currentConversationType = conversationType as 'channel' | 'chat';
        this.currentConversationId = conversationId;
      });

    this.chatActiveRouterService
      .getMessageId$(this.route)
      .subscribe((messageId) => {
        this.messageId = messageId;
      });
  }

  /**
   * This function tells the displayed-post-component, that the user ended editing (either by cancellilng or submitting).
   * This way, the edit-displayed-post is replaced by a p-tag with the posts text.
   */
  endEdit() {
    this.overlayService.editPostActive = false;
    this.endEditingPost.emit();
  }

  /**
   * This function updates the post with the edited text.
   * After that, endEdit() is called to close the edit-mode.
   *
   *  @param text - the image-path for the chosen emoji.
   */
  async submitEdit(text: string) {
    await this.postService.updatePost(
      { text: text },
      this.currentConversationType,
      this.currentConversationId,
      this.messageId == null ? this.post.id! : this.messageId,
      this.messageId == null ? '' : this.post.id!
    );
    this.endEdit();
  }
}
