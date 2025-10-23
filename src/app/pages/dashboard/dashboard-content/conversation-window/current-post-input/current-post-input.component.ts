import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../../services/auth.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ConversationActiveRouterService } from '../../../../../services/conversation-active-router.service';
import { PostService } from '../../../../../services/post.service';
import { filter, Subject, takeUntil, of, Observable, take } from 'rxjs';
import { SearchResult } from '../../../../../shared/types/search-result.type';
import { SearchService } from '../../../../../services/search.service';
import { OverlayService } from '../../../../../services/overlay.service';
import { EmojiPickerComponent } from '../../../../../overlay/emoji-picker/emoji-picker.component';
import { EMOJIS } from '../../../../../shared/constants/emojis';
import { SearchResultsCurrentPostInputComponent } from '../../../../../overlay/search-results-current-post-input/search-results-current-post-input.component';
import { ScreenSize } from '../../../../../shared/types/screen-size.type';
import { ScreenService } from '../../../../../services/screen.service';
import { UserInterface } from '../../../../../shared/models/user.interface';
import { ChannelInterface } from '../../../../../shared/models/channel.interface';
import { ChannelsService } from '../../../../../services/channels.service';
import { ChatService } from '../../../../../services/chat.service';
import { UserService } from '../../../../../services/user.service';

@Component({
  selector: 'app-current-post-input',
  imports: [ CommonModule, ReactiveFormsModule ],
  templateUrl: './current-post-input.component.html',
  styleUrl: './current-post-input.component.scss',
})
export class CurrentPostInput implements OnInit, OnDestroy {
  @Input() conversationWindowState?: 'conversation' | 'thread';
  @ViewChild('textareaThread') textareaThread!: ElementRef;
  @ViewChild('textareaConversation') textareaConversation!: ElementRef;
  emojis = EMOJIS;
  screenSize$!: Observable<ScreenSize>;
  destroy$ = new Subject<void>();
  searchResults: SearchResult[] = [];
  searchChar: '@' | '#' | null = null;
  conversationType!: 'channel' | 'chat';
  errorMessage: string | null = null;
  searchText: string | null = null;
  savedRange: Range | null = null;
  conversationName!: string | null;
  messageToReplyId!: string | null;
  conversationId!: string;

  constructor(
    private authService: AuthService,
    private channelService: ChannelsService,
    private chatService: ChatService,
    private conversationActiveRouterService: ConversationActiveRouterService,
    public overlayService: OverlayService,
    public postService: PostService,
    private route: ActivatedRoute,
    private router: Router,
    public screenService: ScreenService,
    public searchService: SearchService,
    private userService: UserService
  ) {
    this.screenSize$ = this.screenService.screenSize$;
  }

  ngOnInit() {
    this.initConversationType();
    this.initConversationId();
    this.initMessageReplyFocus();
    this.initRouterReset();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initializes the current conversation type based on route params.
   */
  initConversationType() {
    this.conversationActiveRouterService
      .getConversationType$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe((conversationType: string) => this.conversationType = conversationType as 'channel' | 'chat');
  }

  /**
   * Tracks conversation ID changes and updates conversation name.
   */
  initConversationId() {
    this.conversationActiveRouterService
      .getConversationId$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => {
        this.conversationId = id;
        this.getConversationName();
      });
  }

  /**
   * Tracks message-to-reply changes and manages textarea focus accordingly.
   */
  initMessageReplyFocus() {
    this.conversationActiveRouterService
      .getMessageId$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe((msgId) => {
        this.messageToReplyId = msgId;
        setTimeout(() => {
          if (this.messageToReplyId) { this.postService.focusAtEndEditable(this.textareaThread || null);
          } else this.postService.focusAtEndEditable(this.textareaConversation);
        });
      });
  }

  /**
   * Clears both textareas whenever a navigation occurs.
   */
  initRouterReset() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.textareaConversation) this.textareaConversation.nativeElement.innerHTML = '';
        if (this.textareaThread) this.textareaThread.nativeElement.innerHTML = '';
      });
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
   * This function sets the name of the current conversation, whether its a channel or a chat.
   */
  getConversationName() {
    if (this.conversationType === 'channel') {
      this.channelService
        .getCurrentChannel(this.conversationId)
        .pipe(takeUntil(this.destroy$))
        .subscribe((channel) => this.conversationName = '#' + channel!.name || '');
    } else if (this.conversationType === 'chat') {
      const otherUserId = this.chatService.getOtherUserId( this.conversationId, this.authService.getCurrentUserId()!);
      this.userService
        .getUserById(otherUserId)
        .pipe(takeUntil(this.destroy$))
        .subscribe((user) => this.conversationName = '@' + user!.name || '');
    } else this.conversationName = null;
  }

  /**
   * Handles user input events in the message field.
   * Updates the search context, triggers search if needed, and cleans up empty input.
   */
  onInput() {
    this.updateSearchContext();
    this.handleSearchIfNeeded();
    if (this.postTextInput.nativeElement.innerHTML.trim() === '<br>') this.postTextInput.nativeElement.innerText = '';
  }

  /**
   * Updates the current search context by detecting trigger characters (@ or #)
   * and saving the text selection range for later insertion.
   */
  updateSearchContext() {
    this.searchText = this.getInputContentBeforeCursor();
    const lastChar = this.searchText.slice(-1);
    if (lastChar === '@' || lastChar === '#') {
      this.searchChar = lastChar;
    } else if (!this.searchText.includes(this.searchChar!) || !this.searchText) {
      this.searchChar = null;
      this.overlayService.closeAll();
    }
    if (this.searchChar) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) this.savedRange = selection.getRangeAt(0).cloneRange();
    }
  }

  /**
   * Performs a user or channel search when a trigger character is active.
   * Opens or closes the overlay depending on the search results.
   */
  handleSearchIfNeeded() {
    if (!this.searchChar) return;
    const term$ = this.searchText!.length === 1
        ? of(this.searchChar!)
        : of(this.searchText);
    this.searchService
      .search(term$ as Observable<string>, { includeAllChannels: this.searchText!.length === 1 })
      .pipe(take(1))
      .subscribe((results) => {
        if (results.length === 0) return this.overlayService.closeAll();
        this.openSearchOverlay(results);
      });
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
   * @param emoji - The emoji-object from the EMOJIS-array.
   */
  addEmoji(emoji: { token: string; src: string }) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const img = `<img src="${emoji.src}" alt="${emoji.token}" class='emoji'>`;
    document.execCommand('insertHTML', false, img);
  }

  /**
   * This function opens the emoji-picker overlay.
   * The overlay possibly emits an emoji and this emoji is added to the posts text.
   *
   * @param event - The user-interaction with an object.
   */
  openEmojiPickerOverlay(event: MouseEvent) {
    const overlay = this.overlayService.openComponent(
      EmojiPickerComponent,
      'cdk-overlay-transparent-backdrop',
      {
        origin: event.currentTarget as HTMLElement,
        originPosition: { originX: 'end', originY: 'bottom', overlayX: 'start', overlayY: 'bottom'},
        originPositionFallback: { originX: 'end', originY: 'bottom', overlayX: 'start', overlayY: 'top'},
      },
      { rightAngleBottomLeft: true }
    );
    overlay!.ref.instance.selectedEmoji.subscribe((emoji: { token: string; src: string }) => {
      this.addEmoji(emoji);
      this.overlayService.closeAll();
    });
  }

  /**
   * Opens the SearchResultsCurrentPostInput-Overlay with user/channel results.
   *
   * @param results - The search results that should be displayed.
   */
  openSearchOverlay(results: SearchResult[]) {
    this.overlayService.closeAll();
    const overlayRef = this.overlayService.openComponent(
      SearchResultsCurrentPostInputComponent,
      'cdk-overlay-transparent-backdrop',
      {
        origin: this.postTextInput.nativeElement,
        originPosition: { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom'},
      },
      { results }
    );
    if (!overlayRef) return;
    this.handleSelection(overlayRef, 'user');
    this.handleSelection(overlayRef, 'channel');
  }

  /**
   * Handles selection of a result (user or channel) from the overlay.
   * 
   * @param overlayRef Reference to the overlay component.
   * @param type Type of result: 'user' or 'channel'.
   */
  handleSelection(overlayRef: any, type: 'user' | 'channel') {
    const eventName = type === 'user' ? 'userSelected' : 'channelSelected';
    overlayRef.ref.instance[eventName]
      ?.pipe(take(1))
      .subscribe((item: UserInterface | ChannelInterface) => {
        this.insertName(this.getMarkTemplate(item.name, type));
        this.overlayService.closeAll();
      });
  }

  /**
   * This function deletes the searchText from the postTextInput and adds the selected mark instead.
   * After that, all variables are set back to default.
   *
   * @param mark - The marked user- or channel name as a template.
   */
  async insertName(mark: string) {
    const selection = window.getSelection();
    if (!this.savedRange || !selection) return;
    selection.removeAllRanges();
    selection.addRange(this.savedRange);
    const range = selection.getRangeAt(0);
    range.collapse(false);
    if (this.searchText) await this.deleteAfterSearchChar(this.searchText.length);
    document.execCommand('insertHTML', false, mark);
    this.postService.focusAtEndEditable(this.postTextInput);
    this.searchResults = [];
    this.searchChar = null;
    this.searchText = null;
    this.savedRange = null;
  }

  /**
   * This function returns a template for the marked user or channel.
   *
   * @param name - The selected user- or channelname or the selected '@'-char
   * @param typeOfResult - Whether the result is of type user or channel
   */
  getMarkTemplate(name: string, typeOfResult?: 'user' | 'channel'): string {
    return `<mark class="mark" contenteditable="false">
              <img src="./assets/img/${
                typeOfResult == 'user' ? 'alternate-email-purple' : 'tag-blue'
              }.svg" alt="mark-${typeOfResult}">
              <span>${name}</span>
            </mark>`;
  }

  /**
   * This function deletes the chars of the searchText and the searchChar.
   *
   * @param length - How many chars should be deleted
   */
  async deleteAfterSearchChar(length: number) {
    const selection = window.getSelection();
    const range = selection!.getRangeAt(0).cloneRange();
    range.setStart(range.endContainer, Math.max(range.endOffset - length, 0));
    range.deleteContents();
    selection!.removeAllRanges();
    selection!.addRange(range);
  }

  /**
   * Handles the message submit action for both main and thread inputs.
   * Converts HTML to text, validates, sends the message, and resets the editor state.
   */
  submitPostInput() {
    const currentUserId = this.authService.currentUser?.uid ?? null;
    const postText = this.postService.htmlToText(this.postTextInput.nativeElement.innerHTML);
    if (postText.trim() == '') return this.postService.focusAtEndEditable(this.postTextInput);
    this.sendPost(postText, currentUserId!);
    this.resetPostInputState();
  }

  /**
   * Sends either a message or a reply depending on the active input field.
   * 
   * @param postText - The text content of the post.
   * @param currentUserId - The ID of the current user.
   */
  sendPost(postText: string, currentUserId: string) {
    if (this.postTextInput === this.textareaThread) {
      this.postService.createAnswer(
        this.conversationId,
        this.messageToReplyId!,
        currentUserId,
        postText,
        this.conversationType
      );
    } else {
      this.postService.createMessage(
        this.conversationId,
        currentUserId,
        postText,
        this.conversationType
      );
    }
  }

  /**
   * Resets the message input and search overlay state after sending a post.
   */
  resetPostInputState() {
    this.postTextInput.nativeElement.innerHTML = '';
    this.searchResults = [];
    this.searchChar = null;
    this.searchText = null;
    this.overlayService.closeAll();
    this.postService.focusAtEndEditable(this.postTextInput);
  }
}