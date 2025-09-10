import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { ChatActiveRouterService } from '../../../../services/chat-active-router.service';
import { PostService } from '../../../../services/post.service';
import {
  startWith,
  debounceTime,
  filter,
  switchMap,
  Subject,
  takeUntil,
} from 'rxjs';
import { SearchResult } from '../../../../shared/types/search-result.type';
import { SearchService } from '../../../../services/search.service';
import { UserListItemComponent } from '../../../../shared/components/user-list-item/user-list-item.component';
import { ChannelListItemComponent } from '../../../../shared/components/channel-list-item/channel-list-item.component';
import { OverlayService } from '../../../../services/overlay.service';
import { EmojiPickerComponent } from '../../../../overlay/emoji-picker/emoji-picker.component';
import { EMOJIS } from '../../../../shared/constants/emojis';

@Component({
  selector: 'app-current-post-input',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UserListItemComponent,
    ChannelListItemComponent,
  ],
  templateUrl: './current-post-input.component.html',
  styleUrl: './current-post-input.component.scss',
})
export class CurrentPostInput {
  conversationType!: any;
  conversationId!: string;
  /** If replying, holds the ID of the message being replied to; otherwise null. */
  messageToReplyId: string | null = null;
  /** Stores any error message to be displayed in the input form. */
  errorMessage: string | null = null;
  /** Reactive form for creating a new message or reply. */
  postForm: FormGroup = new FormGroup({
    /** Input field for the message text. */
    text: new FormControl('', []),
  });
  searchResults: SearchResult[] = [];
  emojis = EMOJIS;
  private destroy$ = new Subject<void>();

  @ViewChild('postId') postTextInput!: ElementRef;

  constructor(
    private authService: AuthService,
    public overlayService: OverlayService,
    public postService: PostService,
    public searchService: SearchService,
    private route: ActivatedRoute,
    private chatActiveRouterService: ChatActiveRouterService
  ) {}

  /**
   * Angular lifecycle hook that runs after the component is initialized.
   * Subscribes to the route parameters (type, conversationId, messageId) via ChatActiveRouterService
   * and updates local state accordingly.
   */
  ngOnInit() {
    this.chatActiveRouterService
      .getConversationType$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe((t) => {
        this.conversationType = t;
        //console.log(`aici trebuie tip  |  ${this.type} `);
      });
    this.chatActiveRouterService
      .getConversationId$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => {
        this.conversationId = id;
        //console.log(`aici channelid    | ${this.conversationId}`);
      });
    this.chatActiveRouterService
      .getMessageId$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe((msgId) => {
        this.messageToReplyId = msgId;
        //console.log(` aici messageid    |  ${this.messageToReplyId}`);
      });

    // Stream für Textarea Änderungen
    this.postForm
      .get('text')!
      .valueChanges.pipe(
        startWith(this.postForm.get('text')!.value),
        debounceTime(200),
        filter((text) => !!text), // nur wenn etwas eingegeben wurde
        switchMap((text) => {
          text = text.trim();
          if (text.startsWith('@') || text.startsWith('#')) {
            // ⬇️ HIER die Option setzen
            return this.searchService.search(
              this.postForm.get('text')!.valueChanges.pipe(startWith(text)),
              { includeAllChannels: true }
            );
          }
          return [[]]; // leeres Array sonst
        })
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((results: SearchResult[]) => {
        this.searchResults = results;
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
  addEmoji(emoji: { token: string; src: string;}) {
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

    overlay!.ref.instance.selectedEmoji.subscribe((emoji: { token: string; src: string;}) => {
      this.addEmoji(emoji);
      this.overlayService.closeAll();
    });
  }

  /**
   * Handles form submission:
   * - Retrieves the entered message text.
   * - Checks if the user is replying to an existing message or creating a new one.
   * - Calls PostService accordingly.
   * - Resets the form afterwards.
   */
  onSubmit() {
    const currentUserId: string | null = this.authService.currentUser.uid;
    const postText = this.postService.htmlToText(
      this.postTextInput.nativeElement.innerHTML
    );

    if (this.messageToReplyId) {
      this.postService.createAnswer(
        this.conversationId,
        this.messageToReplyId,
        currentUserId!,
        postText,
        this.conversationType
      );
    } else {
      this.postService.createMessage(
        this.conversationId,
        currentUserId!,
        postText,
        this.conversationType
      );
    }
    this.postTextInput.nativeElement.innerHTML = '';
  }
}
