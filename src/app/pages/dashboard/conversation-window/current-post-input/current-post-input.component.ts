import {
  Component,
  ElementRef,
  inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { ConversationActiveRouterService } from '../../../../services/conversation-active-router.service';
import { PostService } from '../../../../services/post.service';
import {
  startWith,
  debounceTime,
  filter,
  switchMap,
  Subject,
  takeUntil,
  distinctUntilChanged,
  of,
  Observable,
  take,
} from 'rxjs';
import { SearchResult } from '../../../../shared/types/search-result.type';
import { SearchService } from '../../../../services/search.service';
import { UserListItemComponent } from '../../../../shared/components/user-list-item/user-list-item.component';
import { ChannelListItemComponent } from '../../../../shared/components/channel-list-item/channel-list-item.component';
import { OverlayService } from '../../../../services/overlay.service';
import { EmojiPickerComponent } from '../../../../overlay/emoji-picker/emoji-picker.component';
import { EMOJIS } from '../../../../shared/constants/emojis';
import { SearchResultsCurrentPostInputComponent } from '../../../../overlay/search-results-current-post-input/search-results-current-post-input.component';
import { ScreenSize } from '../../../../shared/types/screen-size.type';
import { ScreenService } from '../../../../services/screen.service';
import { UserInterface } from '../../../../shared/models/user.interface';
import { ChannelInterface } from '../../../../shared/models/channel.interface';
import { ChannelsService } from '../../../../services/channels.service';
import { ChatService } from '../../../../services/chat.service';
import { UserService } from '../../../../services/user.service';

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
export class CurrentPostInput implements OnInit, OnDestroy {
  conversationType!: 'channel' | 'chat';
  conversationId!: string;
  conversationName!: string;
  /** If replying, holds the ID of the message being replied to; otherwise null. */
  messageToReplyId!: string | null;
  /** Stores any error message to be displayed in the input form. */
  errorMessage: string | null = null;
  @ViewChild('textareaThread') textareaThread!: ElementRef;
  @ViewChild('textareaConversation') textareaConversation!: ElementRef;
  searchResults: SearchResult[] = [];
  searchChar: '@' | '#' | null = null;
  searchText: string | null = null;
  emojis = EMOJIS;
  screenSize$!: Observable<ScreenSize>;
  @Input() conversationWindowState?: 'conversation' | 'thread';
  private savedRange: Range | null = null;
  private destroy$ = new Subject<void>();
  constructor(
    public screenService: ScreenService,
    public overlayService: OverlayService,
    public postService: PostService,
    public searchService: SearchService,
    private authService: AuthService,
    private channelService: ChannelsService,
    private chatService: ChatService,
    private userService: UserService,
    private route: ActivatedRoute,
    private conversationActiveRouterService: ConversationActiveRouterService
  ) {
    this.screenSize$ = this.screenService.screenSize$;
  }

  /**
   * Angular lifecycle hook that runs after the component is initialized.
   * Subscribes to the route parameters (type, conversationId, messageId) via ConversationActiveRouterService
   * and updates local state accordingly.
   */
  ngOnInit() {
    this.conversationActiveRouterService
      .getConversationType$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe((conversationType: string) => {
        this.conversationType = conversationType as 'channel' | 'chat';
      });

    this.conversationActiveRouterService
      .getConversationId$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => {
        this.conversationId = id;
      });

    this.conversationActiveRouterService
      .getMessageId$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe((msgId) => {
        this.messageToReplyId = msgId;
        setTimeout(() => {
          if (this.messageToReplyId) {
            this.postService.focusAtEndEditable(this.textareaThread || null);
          } else {
            this.postService.focusAtEndEditable(this.textareaConversation);
          }
        });
      });

    if (this.conversationType === 'channel') {
      this.channelService
        .getCurrentChannel(this.conversationId)
        .pipe(take(1))
        .subscribe((channel) => {
          this.conversationName = channel!.name;
        });
    } else {
      console.log(this.conversationId);
      const otherUserId = this.chatService.getOtherUserId(
        this.conversationId,
        this.authService.getCurrentUserId()!
      );
      this.userService
        .getUserById(otherUserId)
        .pipe(take(1))
        .subscribe((user) => {
          this.conversationName = user.name;
        });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * This Getter returns the textarea that belongs to the conversationWindowState (thread or conversation)
   */
  get postTextInput(): ElementRef {
    return this.conversationWindowState === 'conversation'
      ? this.textareaConversation
      : this.textareaThread;
  }

  /**
   * This function handles the textarea's input.
   * When @ or # are added in the input, the searchChar is set to this char.
   * When the textBeforeCursor does not include the searchChar anymore, the searchChar is set back to null.
   * If a searchChar exists the searchOverlay with all users (@) or channels (#) opens.
   * If there are more chars after the searchChar, the searchOverlays results are filtered to match the textBeforeCursor.
   */
  onInput() {
    this.searchText = this.getInputContentBeforeCursor();
    const lastChar = this.searchText.slice(-1);

    if (lastChar === '@' || lastChar === '#') {
      this.searchChar = lastChar;
    } else if (
      !this.searchText.includes(this.searchChar!) ||
      !this.searchText
    ) {
      this.searchChar = null;
      this.overlayService.closeAll();
    }

    if (this.searchChar) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        this.savedRange = selection.getRangeAt(0).cloneRange();
      }

      if (this.searchText.length == 1) {
        this.searchService
          .search(of(this.searchChar!), { includeAllChannels: true })
          .pipe(take(1))
          .subscribe((results) => {
            if (results.length === 0) return this.overlayService.closeAll();
            this.openSearchOverlay(results);
          });
      } else if (this.searchText.length > 1) {
        this.searchService
          .search(of(this.searchText))
          .pipe(take(1))
          .subscribe((results) => {
            if (results.length === 0) return this.overlayService.closeAll();
            this.openSearchOverlay(results);
          });
      }
    }

    if (this.postTextInput.nativeElement.innerText.trim() === '') {
      this.postTextInput.nativeElement.innerText = '';
    }
  }

  /**
   * This function returns the textBeforeCursor untill the last searchChar.
   */
  getInputContentBeforeCursor(): string {
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return '';

    const range = selection.getRangeAt(0).cloneRange();
    range.selectNodeContents(this.postTextInput.nativeElement);
    range.setEnd(selection.anchorNode, selection.anchorOffset);

    const textBeforeCursor = range.cloneContents().textContent || '';
    const lastAt = textBeforeCursor.lastIndexOf('@');
    const lastHash = textBeforeCursor.lastIndexOf('#');
    const lastTrigger = Math.max(lastAt, lastHash);

    if (lastTrigger === -1) return '';

    return textBeforeCursor.substring(lastTrigger);
  }

  /**
   * This function adds an '@' char in the input (like the user typed it in).
   */
  insertAt() {
    this.postTextInput.nativeElement.innerHTML += '@';
    this.postService.focusAtEndEditable(this.postTextInput);
    this.onInput();
  }

  /**
   * This function adds the chosen emoji to the input field as an image.
   *
   * @param emoji the emoji-object from the EMOJIS-array.
   */
  addEmoji(emoji: { token: string; src: string }) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const img = `&nbsp;<img src="${emoji.src}" alt="${emoji.token}" class='emoji'>&nbsp;`;
    document.execCommand('insertHTML', false, img);
  }

  /**
   * This function opens the emoji-picker overlay.
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
        this.overlayService.closeAll();
      }
    );
  }

  /**
   * Handles form submission:
   * - Retrieves the entered message text.
   * - Checks if the user is replying to an existing message or creating a new one.
   * - Calls PostService accordingly.
   * - Resets the form afterwards.
   */
  submitPostInput() {
    const currentUserId: string | null =
      this.authService.currentUser?.uid ?? null;
    const postText = this.postService.htmlToText(
      this.postTextInput.nativeElement.innerHTML
    );

    if (postText.trim() == '')
      return this.postService.focusAtEndEditable(this.postTextInput);

    if (this.postTextInput === this.textareaThread) {
      this.postService.createAnswer(
        this.conversationId,
        this.messageToReplyId!,
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
    this.searchResults = [];
    this.searchChar = null;
    this.searchText = null;
    this.overlayService.closeAll();
    this.postService.focusAtEndEditable(this.postTextInput);
  }

  /**
   * Opens the search overlay with user/channel results.
   *
   * @param results the search results that should be displayed.
   */
  openSearchOverlay(results: SearchResult[]) {
    this.overlayService.closeAll();
    const overlayRef = this.overlayService.openComponent(
      SearchResultsCurrentPostInputComponent,
      'cdk-overlay-transparent-backdrop',
      {
        origin: this.postTextInput.nativeElement,
        originPosition: {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
        },
      },
      { results }
    );

    if (overlayRef) {
      overlayRef.ref.instance.userSelected
        ?.pipe(take(1))
        .subscribe((user: UserInterface) => {
          const mark = this.getMarkTemplate(user.name, 'user');
          this.insertName(mark);
          this.overlayService.closeAll();
        });

      overlayRef.ref.instance.channelSelected
        ?.pipe(take(1))
        .subscribe((channel: ChannelInterface) => {
          const mark = this.getMarkTemplate(channel.name, 'channel');
          this.insertName(mark);
          this.overlayService.closeAll();
        });
    }
  }

  /**
   * This function deletes the searchText from the postTextInput and adds the selected mark instead.
   * After that, all variables are set back to default.
   *
   * @param mark the marked user- or channel name as a template.
   */
  insertName(mark: string) {
    const selection = window.getSelection();
    if (!this.savedRange || !selection) return;
    selection.removeAllRanges();
    selection.addRange(this.savedRange);
    const range = selection.getRangeAt(0);
    range.collapse(false);

    if (this.searchText) this.deleteAfterSearchChar(this.searchText.length);
    document.execCommand('insertHTML', false, mark);
    this.searchResults = [];
    this.searchChar = null;
    this.searchText = null;
    this.savedRange = null;
  }

  /**
   * This function returns a template for the marked user or channel.
   *
   * @param name the selected user- or channelname or the selected '@'-char
   * @param typeOfResult whether the result is of type user or channel
   */
  getMarkTemplate(name: string, typeOfResult?: 'user' | 'channel'): string {
    return `&nbsp;<mark class="mark" contenteditable="false">
              <img src="/assets/img/${
                typeOfResult == 'user' ? 'alternate-email-purple' : 'tag-blue'
              }.svg" alt="mark-${typeOfResult}">
              <span>${name}</span>
            </mark>`;
  }

  /**
   * This function deletes the chars of the searchText and the searchChar.
   *
   * @param length how many chars should be deleted
   */
  deleteAfterSearchChar(length: number) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    let node = selection.anchorNode!;
    let offset = selection.anchorOffset;

    if (node.nodeType !== Node.TEXT_NODE) {
      node = node.childNodes[offset - 1] || node;
      if (node.nodeType !== Node.TEXT_NODE) return;
      offset = (node.textContent || '').length;
    }

    const startOffset = Math.max(offset - length, 0);
    const range = document.createRange();
    range.setStart(node, startOffset);
    range.setEnd(node, offset);
    range.deleteContents();
  }
}
