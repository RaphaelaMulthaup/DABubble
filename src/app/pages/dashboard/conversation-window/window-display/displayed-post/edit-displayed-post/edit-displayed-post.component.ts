import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { PostInterface } from '../../../../../../shared/models/post.interface';
import { ChatActiveRouterService } from '../../../../../../services/chat-active-router.service';
import { ActivatedRoute } from '@angular/router';
import { PostService } from '../../../../../../services/post.service';
import { OverlayService } from '../../../../../../services/overlay.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-edit-displayed-post',
  imports: [],
  templateUrl: './edit-displayed-post.component.html',
  styleUrl: './edit-displayed-post.component.scss',
})
export class EditDisplayedPostComponent implements OnInit {
  @Input() post!: PostInterface;
  // @Output() endEditingPost = new EventEmitter<void>();
  currentConversationType!: 'channel' | 'chat';
  currentConversationId!: string;
  messageId!: string;
  private destroy$ = new Subject<void>();

  constructor(
    private overlayService: OverlayService,
    private postService: PostService,
    private route: ActivatedRoute,
    private chatActiveRouterService: ChatActiveRouterService
  ) {}

  ngOnInit() {
    this.chatActiveRouterService
      .getParams$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ conversationType, conversationId }) => {
        this.currentConversationType = conversationType as 'channel' | 'chat';
        this.currentConversationId = conversationId;
      });

    this.chatActiveRouterService
      .getMessageId$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe((messageId) => {
        this.messageId = messageId;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * This function tells the displayed-post-component, that the user ended editing (either by cancellilng or submitting).
   * This way, the edit-displayed-post is replaced by a p-tag with the posts text.
   */
  endEdit() {
    // this.overlayService.editPostActive = false;
    // this.endEditingPost.emit();
    this.overlayService.editingPostId.set(null);
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
