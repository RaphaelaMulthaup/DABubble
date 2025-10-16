import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { PostInterface } from '../../../../../../../shared/models/post.interface';
import { ConversationActiveRouterService } from '../../../../../../../services/conversation-active-router.service';
import { ActivatedRoute } from '@angular/router';
import { PostService } from '../../../../../../../services/post.service';
import { OverlayService } from '../../../../../../../services/overlay.service';
import { combineLatest, Subject, take, takeUntil } from 'rxjs';
import { EMOJIS } from '../../../../../../../shared/constants/emojis';
import { EmojiPickerComponent } from '../../../../../../../overlay/emoji-picker/emoji-picker.component';
import { OverlayPositionInterface } from '../../../../../../../shared/models/overlay.position.interface';

@Component({
  selector: 'app-edit-displayed-post',
  imports: [],
  templateUrl: './edit-displayed-post.component.html',
  styleUrl: './edit-displayed-post.component.scss',
})
export class EditDisplayedPostComponent implements OnInit {
  @Input() post!: PostInterface;
  @Input() conversationWindowState?: 'conversation' | 'thread';

  @ViewChild('textareaEdit') postTextInput!: ElementRef;
  private destroy$ = new Subject<void>();
  emojis = EMOJIS;
  currentConversationType!: 'channel' | 'chat';
  currentConversationId!: string;
  messageId!: string;

  constructor(
    private conversationActiveRouterService: ConversationActiveRouterService,
    private overlayService: OverlayService,
    public postService: PostService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    combineLatest([
      this.conversationActiveRouterService.getParams$(this.route),
      this.conversationActiveRouterService.getMessageId$(this.route),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([{ conversationType, conversationId }, messageId]) => {
        this.currentConversationType = conversationType as 'channel' | 'chat';
        this.currentConversationId = conversationId;
        this.messageId = messageId;
      });
  }

  ngAfterViewInit() {
    const textarea = this.postTextInput.nativeElement as HTMLElement;
    textarea.querySelectorAll('mark.mark').forEach((mark) => {
      mark.setAttribute('contenteditable', 'false');
    });
    this.postService.focusAtEndEditable(this.postTextInput);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * This function adds the chosen emoji to the input field as an image.
   *
   * @param emoji - The emoji-object from the EMOJIS-array.
   */
  addEmoji(emoji: { token: string; src: string }) {
    this.postService.focusAtEndEditable(this.postTextInput);
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const img = `&nbsp;<img src="${emoji.src}" alt="${emoji.token}" class='emoji'>&nbsp;`;
    document.execCommand('insertHTML', false, img);
  }

  /**
   * This function opens the EmojiPicker-Overlay.
   * The overlay possibly emits an emoji and this emoji is used to react to the post.
   *
   * @param event - The user-interaction with an object.
   */
  async openEmojiPickerOverlay(event: MouseEvent) {
    event.preventDefault();
    const overlay = this.overlayService.openComponent(
      EmojiPickerComponent,
      'cdk-overlay-transparent-backdrop',
      await this.resolveEmojiPickerPosition(event),
      { rightAngleBottomLeft: true }
    );

    overlay!.ref.instance.selectedEmoji
      .pipe(take(1))
      .subscribe((emoji: { token: string; src: string }) => {
        this.addEmoji(emoji);
        this.overlayService.closeAll();
      });
  }
  
  /**
   * Returns the OverlayPosition for the EmojiPicker-Overlay.
   *
   * @param event - The user-interaction with an object.
   */
  async resolveEmojiPickerPosition(event: MouseEvent): Promise<OverlayPositionInterface> {
    return {
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
  }

  /**
   * This function tells the displayed-post-component, that the user ended editing (either by cancellilng or submitting).
   * This way, the edit-displayed-post is replaced by a p-tag with the posts text.
   */
  endEdit() {
    this.overlayService.editingPostId.set(null);
    this.overlayService.closeAll();
  }

  /**
   * This function updates the post with the edited text.
   * After that, endEdit() is called to close the edit-mode.
   */
  async submitEdit() {
    const postText = this.postService.htmlToText(
      this.postTextInput.nativeElement.innerHTML
    );
    if (postText.trim() == '') return this.postService.focusAtEndEditable(this.postTextInput);
    this.updateCurrentPost(postText)
    this.endEdit();
  }

  /**
   * Updates the current post with new text.
   * Determines the correct target ID and extra ID based on the conversation window state.
   *
   * @param postText - The text to update the post with.
   */
  updateCurrentPost(postText: string) {
    const targetId = this.conversationWindowState === 'thread' ? this.messageId : this.post.id!;
    const extraId = this.conversationWindowState === 'thread' ? this.post.id! : undefined;

    this.postService.updatePost(
      { text: postText },
      this.currentConversationType,
      this.currentConversationId,
      targetId,
      extraId
    );
  }
}
