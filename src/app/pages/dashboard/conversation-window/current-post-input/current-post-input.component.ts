import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
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
  distinctUntilChanged,
  of,
} from 'rxjs';
import { SearchResult } from '../../../../shared/types/search-result.type';
import { SearchService } from '../../../../services/search.service';
import { UserListItemComponent } from '../../../../shared/components/user-list-item/user-list-item.component';
import { ChannelListItemComponent } from '../../../../shared/components/channel-list-item/channel-list-item.component';
import { OverlayService } from '../../../../services/overlay.service';
import { EmojiPickerComponent } from '../../../../overlay/emoji-picker/emoji-picker.component';
import { EMOJIS } from '../../../../shared/constants/emojis';
import { SearchResultsCurrentPostInputComponent } from '../../../../overlay/search-results-current-post-input/search-results-current-post-input.component';

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
  messageToReplyId: string | null = null;
  /** Stores any error message to be displayed in the input form. */
  errorMessage: string | null = null;
  /** Reactive form for creating a new message or reply. */
  // postForm: FormGroup = new FormGroup({
  //   /** Input field for the message text. */
  //   text: new FormControl('', []),
  // });
  @ViewChild('textarea') postTextInput!: ElementRef;
  searchResults: SearchResult[] = [];
  searchChar: '@' | '#' | null = null;
  searchText: string | null = null;
  emojis = EMOJIS;
  private destroy$ = new Subject<void>();

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
      });

    this.chatActiveRouterService
      .getConversationId$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => {
        this.conversationId = id;
      });

    this.chatActiveRouterService
      .getMessageId$(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe((msgId) => {
        this.messageToReplyId = msgId;
      });

    // this.postForm
    //   .get('text')!
    //   .valueChanges.pipe(
    //     startWith(''),
    //     debounceTime(200),
    //     distinctUntilChanged(),
    //     switchMap((text: string | null) => {
    //       const safeText = text || '';
    //       const words = safeText.split(/\s+/);
    //       // Nimm das letzte Wort
    //       const lastWord = words[words.length - 1];

    //       if (!lastWord) {
    //         this.searchResults = [];
    //         return of([]);
    //       }

    //       // Prüfe, ob das letzte Wort mit @ oder # beginnt
    //       if (lastWord.startsWith('@') || lastWord.startsWith('#')) {
    //         // Sofortige Suche starten
    //         return this.searchService.search(of(lastWord), {
    //           includeAllChannels: true,
    //         });
    //       } else {
    //         // Kein Suchergebnis anzeigen, wenn das letzte Wort nicht mit @/# beginnt
    //         this.searchResults = [];
    //         return of([]);
    //       }
    //     }),
    //     takeUntil(this.destroy$)
    //   )
    //   .subscribe((results: any[]) => {
    //     this.searchResults = results;
    //     if (results.length > 0) {
    //       this.openSearchOverlay(results);
    //     } else {
    //       this.overlayService.closeAll();
    //     }
    //   });

    setTimeout(() => {
      this.postService.focusAtEndEditable(this.postTextInput);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
    } else if (!this.searchText.includes(this.searchChar!)) {
      this.searchChar = null;
      this.overlayService.closeAll();
    }

    if (this.searchChar) {
      if (this.searchText.length == 1) {
        this.searchService.search(of(this.searchChar!)).subscribe((results) => {
          if (results.length === 0) return this.overlayService.closeAll();
          this.openSearchOverlay(results);
        });
      } else if (this.searchText.length > 1) {
        this.searchService.search(of(this.searchText)).subscribe((results) => {
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

  // /**
  //  * This function returns the textBeforeCursor untill the last searchChar.
  //  */
  // insertChar(char: string) {
  //   this.postService.focusAtEndEditable(this.postTextInput);
  //   const selection = window.getSelection();
  //   if (!selection || !selection.rangeCount) return;
  //   const range = selection.getRangeAt(0);
  //   const textNode = document.createTextNode(char);
  //   range.insertNode(textNode);
  //   this.postService.focusAtEndEditable(this.postTextInput);
  //   this.onInput();
  // }

  /**
   * This function adds the chosen emoji to the input field as an image.
   *
   * @param emoji the emoji-object from the EMOJIS-array.
   */
  addEmoji(emoji: { token: string; src: string }) {
    this.postService.focusAtEndEditable(this.postTextInput);
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const img = `<img src="${emoji.src}" alt="${emoji.token}" class='emoji'>`;
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

    if (postText.trim() == '') return this.postService.focusAtEndEditable(this.postTextInput);

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
    this.searchResults = []; // Reset search results
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
      overlayRef.ref.instance.userSelected?.subscribe((user: any) => {
        this.insertName(user.name, 'user');
      });
      overlayRef.ref.instance.channelSelected?.subscribe((channel: any) => {
        this.insertName(channel.name, 'channel');
      });
    }
  }

  /**
   * This function deletes the searchText from the postTextInput and adds the selected name instead.
   * After that, all variables are set back to default.
   *
   * @param text the selected user- or channelname or the selected '@'-char
   * @param typeOfResult whether the result is of type user or channel
   */
  insertName(text: string, typeOfResult?: 'user' | 'channel') {
    this.overlayService.closeAll();
    this.postService.focusAtEndEditable(this.postTextInput);
    if (this.searchText) this.deleteBeforeCursor(this.searchText.length);
    this.postTextInput.nativeElement.innerHTML += text;
    this.postService.focusAtEndEditable(this.postTextInput);
    this.searchResults = [];
    this.searchChar = null;
    this.searchText = null;
  }

  /**
   * This function deletes the chars of the searchText and the searchChar.
   *
   * @param length how many chars should be deleted
   */
  deleteBeforeCursor(length: number) {
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

  // /**
  //  * Replaces the last word with a selected user or channel name in the input field.
  //  *
  //  * @param name the name to be inserted.
  //  * @param typeOfResult indicates whether it's a 'user' or 'channel'.
  //  */
  // insertName(name: string, typeOfResult: 'user' | 'channel') {
  //   const control = this.postForm.get('text')!;
  //   const text = control.value || '';
  //   const words = text.split(/\s+/);
  //   if (typeOfResult === 'user') {
  //     words[words.length - 1] = name;
  //   } else if (typeOfResult === 'channel') {
  //     words[words.length - 1] = name;
  //   }
  //   // control.setValue(words.join(' ') + ' ');
  //   this.postTextInput.nativeElement.innerHTML += words.join(' ') + ' ';
  //   //this.postTextInput.nativeElement.focus();
  //   this.postService.focusAtEndEditable(this.postTextInput);
  // }

  // /**
  //  * Starts user search by adding '@' to the end of the input text if it's not already there.
  //  */
  // startUserSearch() {
  //   const control = this.postForm.get('text')!;
  //   const text = control.value || '';
  //   console.log(text);
  //   // Überprüfe das letzte Zeichen
  //   const lastChar = text.slice(-1);

  //   // If the last character isn't a space, add a space before the '@'
  //   const newText = lastChar === ' ' ? text + '@' : text + ' @';
  //   control.setValue(newText);
  //   //this.postTextInput.nativeElement.focus();
  //   this.postService.focusAtEndEditable(this.postTextInput);
  // }
}
