import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { PostInterface } from '../../../../../../shared/models/post.interface';
import { ChatActiveRouterService } from '../../../../../../services/chat-active-router.service';
import { ActivatedRoute } from '@angular/router';
import { PostService } from '../../../../../../services/post.service';

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

  @Input() post!: PostInterface;
  @Output() endEditingPost = new EventEmitter<void>();

  currentType!: 'channel' | 'chat';
  currentConversationId!: string;

  constructor() {
    this.chatActiveRouterService
      .getParams$(this.route)
      .subscribe(({ type, id }) => {
        this.currentType = type as 'channel' | 'chat';
        this.currentConversationId = id;
      });
  }

  /**
   * This function tells the displayed-post-component, that the user ended editing (either by cancellilng or submitting).
   * This way, the edit-displayed-post is replaced by a p-tag with the posts text.
   */
  endEdit() {
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
      this.currentType,
      this.currentConversationId,
      this.post.id!,
      { text: text }
    );
    this.endEdit();
  }
}
