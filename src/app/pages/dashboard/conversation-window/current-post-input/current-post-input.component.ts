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
  postForm: FormGroup = new FormGroup({
    /** Input field for the message text. */
    text: new FormControl('', []),
  });
  searchResults: SearchResult[] = [];
  private destroy$ = new Subject<void>();
  @ViewChild('currentPostInput')
  currentPostInput!: ElementRef<HTMLInputElement>;

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

    this.postForm
      .get('text')!
      .valueChanges.pipe(
        startWith(''),
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((text: string) => {
          // Teile den Text in Tokens
          const words = text.split(/\s+/);
          // Nimm das letzte Wort
          const lastWord = words[words.length - 1];

          if (!lastWord) {
            this.searchResults = [];
            return of([]);
          }

          // Prüfe, ob das letzte Wort mit @ oder # beginnt
          if (lastWord.startsWith('@') || lastWord.startsWith('#')) {
            // Sofortige Suche starten
            return this.searchService.search(of(lastWord), {
              includeAllChannels: true,
            });
          } else {
            // Kein Suchergebnis anzeigen, wenn das letzte Wort nicht mit @/# beginnt
            this.searchResults = [];
            return of([]);
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((results: any[]) => {
        this.searchResults = results;
        if (results.length > 0) {
          this.openSearchOverlay(results);
        } else {
          this.overlayService.closeAll();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * This functions opens the emoji-picker overlay.
   * The overlay possibly emits an emoji and this emoji is added to the posts text.
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

    // overlay!.ref.instance.selectedEmoji.subscribe((emoji: string) => {
    //   this.postService.toggleReaction(
    //     '/' + this.currentType + 's/' + this.currentConversationId,
    //     'messages',
    //     this.post.id!,
    //     emoji
    //   );
    //   this.overlayService.closeAll();
    // });
  }

  /**
   * Handles form submission:
   * - Retrieves the entered message text.
   * - Checks if the user is replying to an existing message or creating a new one.
   * - Calls PostService accordingly.
   * - Resets the form afterwards.
   */
  onSubmit() {
    const post = this.postForm.get('text')?.value;
    const currentUserId: string | null = this.authService.currentUser.uid;

    if (this.messageToReplyId) {
      this.postService.createAnswer(
        this.conversationId,
        this.messageToReplyId,
        currentUserId!,
        post,
        this.conversationType
      );
    } else {
      this.postService.createMessage(
        this.conversationId,
        currentUserId!,
        post,
        this.conversationType
      );
    }
    this.postForm.reset();
    this.searchResults = []; // Suchergebnisse zurücksetzen
  }

  openSearchOverlay(results: any[]) {
    const overlayRef = this.overlayService.openComponent(
      SearchResultsCurrentPostInputComponent,
      'cdk-overlay-transparent-backdrop',
      {
        origin: this.currentPostInput.nativeElement,
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
        this.overlayService.closeAll();
      });
      overlayRef.ref.instance.channelSelected?.subscribe((channel: any) => {
        this.insertName(channel.name, 'channel');
        this.overlayService.closeAll();
      });
    }
  }

  // Setzt den Usernamen anstelle des letzten Tokens in das Inputfeld
  insertName(name: string, typeOfResult: 'user' | 'channel') {
    const control = this.postForm.get('text')!;
    const text = control.value || '';
    const words = text.split(/\s+/);
    if (typeOfResult === 'user') {
      words[words.length - 1] = '@' + name;
    } else if (typeOfResult === 'channel') {
      words[words.length - 1] = '#' + name;
    }
    control.setValue(words.join(' ') + ' ');
    this.currentPostInput.nativeElement.focus();
  }
}
