import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { PostInterface } from '../../../../../../shared/models/post.interface';
import { ConversationActiveRouterService } from '../../../../../../services/conversation-active-router.service';
import { ActivatedRoute } from '@angular/router';
import { PostService } from '../../../../../../services/post.service';
import { OverlayService } from '../../../../../../services/overlay.service';
import { Subject, takeUntil } from 'rxjs';
import { EMOJIS } from '../../../../../../shared/constants/emojis';
import { EmojiPickerComponent } from '../../../../../../overlay/emoji-picker/emoji-picker.component';

@Component({
  selector: 'app-edit-displayed-post',
  imports: [],
  templateUrl: './edit-displayed-post.component.html',
  styleUrl: './edit-displayed-post.component.scss',
})
export class EditDisplayedPostComponent implements OnInit {
  @Input() post!: PostInterface;
  currentConversationType!: 'channel' | 'chat';
  currentConversationId!: string;
  messageId!: string;
  emojis = EMOJIS;
  @ViewChild('textarea') postTextInput!: ElementRef;
  private destroy$ = new Subject<void>();

  constructor(
    private overlayService: OverlayService,
    private route: ActivatedRoute,
    private conversationActiveRouterService: ConversationActiveRouterService,
    public postService: PostService
  ) {}

  ngOnInit() {
    this.conversationActiveRouterService
      .getParams$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ conversationType, conversationId }) => {
        this.currentConversationType = conversationType as 'channel' | 'chat';
        this.currentConversationId = conversationId;
      });

    this.conversationActiveRouterService
      .getMessageId$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe((messageId) => {
        this.messageId = messageId;
      });

    setTimeout(() => {
      this.postService.focusAtEndEditable(this.postTextInput);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * This function adds the chosen emojis to the input field as an image.
   *
   * @param emoji the emoji-object from the EMOJIS-array.
   */
  addEmoji(emoji: { token: string; src: string }) {
    const editor = document.querySelector('.post-text-input') as HTMLElement;
    const img = `<img src="${emoji.src}" alt="${emoji.token}" class='emoji'>`;
    document.execCommand('insertHTML', false, img);
  }

  /**
   * This functions opens the emoji-picker overlay.
   * The overlay possibly emits an emoji and this emoji is added to the posts text.
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
          originX: 'end',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'bottom',
        },
        originPositionFallback: {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
        },
      }
    );

    overlay!.ref.instance.selectedEmoji.subscribe(
      (emoji: { token: string; src: string }) => {
        this.addEmoji(emoji);
        // this.overlayService.closeAll();
      }
    );
  }

  /**
   * This function tells the displayed-post-component, that the user ended editing (either by cancellilng or submitting).
   * This way, the edit-displayed-post is replaced by a p-tag with the posts text.
   */
  endEdit() {
    this.overlayService.editingPostId.set(null);
  }

  /**
   * This function updates the post with the edited text.
   * After that, endEdit() is called to close the edit-mode.
   */
  async submitEdit() {
    const postText = this.postService.htmlToText(
      this.postTextInput.nativeElement.innerHTML
    );
    await this.postService.updatePost(
      { text: postText },
      this.currentConversationType,
      this.currentConversationId,
      this.messageId == null ? this.post.id! : this.messageId,
      this.messageId == null ? '' : this.post.id!
    );
    this.endEdit();
  }
}
