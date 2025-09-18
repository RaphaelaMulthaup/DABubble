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
  conversationType!: any;
  conversationId!: string;
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
  private destroy$ = new Subject<void>();
  private searchOverlayRef: any;

  constructor(
    private authService: AuthService,
    public screenService: ScreenService,
    public overlayService: OverlayService,
    public postService: PostService,
    public searchService: SearchService,

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
      .subscribe((t) => {
        this.conversationType = t;
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
    this.postService.focusAtEndEditable(this.postTextInput);
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
    const currentUserId: string | null = this.authService.currentUser.uid;
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
    if (!results || results.length === 0) {
      this.searchOverlayRef?.close();
      this.searchOverlayRef = null;
      return;
    }

    // Wenn Overlay schon offen ist, nur die Daten aktualisieren
    if (this.searchOverlayRef) {
      this.searchOverlayRef.ref.instance.results = results;
      return;
    }

    // Overlay neu öffnen
    this.searchOverlayRef = this.overlayService.openComponent(
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

    // Subscriptions für Auswahl
    if (this.searchOverlayRef) {
      this.searchOverlayRef.ref.instance.userSelected
        ?.pipe(take(1))
        .subscribe((user: UserInterface) => {
          const mark = this.getMarkTemplate(user.name, 'user');
          this.insertName(mark);
          this.overlayService.closeOne(this.searchOverlayRef);
          this.searchOverlayRef = null;
        });

      this.searchOverlayRef.ref.instance.channelSelected
        ?.pipe(take(1))
        .subscribe((channel: ChannelInterface) => {
          const mark = this.getMarkTemplate(channel.name, 'channel');
          this.insertName(mark);
          this.overlayService.closeOne(this.searchOverlayRef);
          this.searchOverlayRef = null;
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
    this.postService.focusAtEndEditable(this.postTextInput);
    if (this.searchText) this.deleteAfterSearchChar(this.searchText.length);
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    document.execCommand('insertHTML', false, mark);
    this.postService.focusAtEndEditable(this.postTextInput);
    this.searchResults = [];
    this.searchChar = null;
    this.searchText = null;
  }

  /**
   * This function returns a template for the marked user or channel.
   *
   * @param name the selected user- or channelname or the selected '@'-char
   * @param typeOfResult whether the result is of type user or channel
   */
  getMarkTemplate(name: string, typeOfResult?: 'user' | 'channel'): string {
    return `&nbsp;<mark class="mark" contenteditable="false" data="${
      typeOfResult == 'user' ? '@' : '#'
    }${name}">
              <img src="/assets/img/${
                typeOfResult == 'user' ? 'alternate-email-purple' : 'tag-blue'
              }.svg" alt="mark">
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
