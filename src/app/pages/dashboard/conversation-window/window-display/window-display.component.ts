import {
  Component,
  ElementRef,
  inject,
  Input,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService } from '../../../../services/post.service';
import { DisplayedPostComponent } from './displayed-post/displayed-post.component';
import { PostInterface } from '../../../../shared/models/post.interface';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  map,
  Observable,
  Subject,
  Subscription,
  switchMap,
  takeUntil,
} from 'rxjs';
import { ConversationActiveRouterService } from '../../../../services/conversation-active-router.service';
import { tap } from 'rxjs';
import { ChatService } from '../../../../services/chat.service';
import { EmptyChatViewComponent } from './empty-chat-view/empty-chat-view.component';
import { EmptyChannelViewComponent } from './empty-channel-view/empty-channel-view.component';

@Component({
  selector: 'app-window-display', // Component selector used in parent templates
  imports: [
    DisplayedPostComponent,
    CommonModule,
    EmptyChatViewComponent,
    EmptyChannelViewComponent,
  ], // Child components needed in the template
  templateUrl: './window-display.component.html', // External HTML template
  styleUrl: './window-display.component.scss', // External SCSS styles
})
export class WindowDisplayComponent {
  @Input() messages$!: import('rxjs').Observable<PostInterface[]>;
  // Observable stream of all posts in the current conversation

  postInfo: PostInterface[] = []; // Cached list of posts
  currentConversationId?: string; // Current conversation ID
  @ViewChildren(DisplayedPostComponent, { read: ElementRef })
  postElements!: QueryList<ElementRef>; // References to all rendered posts
  channelTyp$?: Observable<string>; // Observable for channel type (chat or channel)

  // Localized days of the week for displaying timestamps
  days = [
    'Sonntag',
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag',
    'Samstag',
  ];

  @Input() conversationWindowState?: 'conversation' | 'thread';
  private pendingScrollTo?: string; // Stores a post ID to scroll to once available
  private destroy$ = new Subject<void>(); // Used to clean up subscriptions

  constructor(
    private el: ElementRef,
    private route: ActivatedRoute,
    private router: Router,
    public postService: PostService,
    private chatService: ChatService,
    private conversationActiveRouterService: ConversationActiveRouterService
  ) {}

  /**
   * Lifecycle hook: initializes subscriptions to route params,
   * messages, and scroll requests.
   */
  ngOnInit() {
    this.channelTyp$ = this.conversationActiveRouterService.getConversationType$(
      this.route
    );

    // Subscribe to conversation ID from route params
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const conversationId = params['conversationId'];
      this.currentConversationId = conversationId;
    });

    // Subscribe to incoming messages
    this.messages$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.onContentChange(this.currentConversationId, data);
    });

    // Subscribe to scroll requests from PostService
    this.postService.selected$
      .pipe(takeUntil(this.destroy$))
      .subscribe((postId) => {
        this.handleScrollRequest(postId);
      });

    // Handle scroll-to from query parameters
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const id = params['scrollTo'];
        if (id) this.handleScrollRequest(id);
      });
  }

  /**
   * Lifecycle hook: runs after view init.
   * Used to scroll to posts once DOM elements are available.
   */
  ngAfterViewInit() {
    // Retry pending scroll requests when ViewChildren change
    this.postElements.changes.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.pendingScrollTo) {
        this.handleScrollRequest(this.pendingScrollTo);
      }
    });

    // Handle initial scrollTo param (on first load)
    const initial = this.route.snapshot.queryParams['scrollTo'];
    if (initial) this.handleScrollRequest(initial);
  }

  /**
   * Lifecycle hook: cleanup when component is destroyed.
   */
  ngOnDestroy() {
    this.tryDeleteEmptyChat(this.currentConversationId);
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Try to delete the chat if it has no messages.
   * @param chatId - ID of the chat to delete
   */
  private tryDeleteEmptyChat(chatId?: string): void {
    if (chatId && this.postInfo.length === 0) {
      this.chatService
        .deleteChat(chatId)
        .then(() => console.log(`Empty chat ${chatId} deleted`))
        .catch((err) => console.error('Error deleting chat', err));
    }
  }

  /**
   * Called whenever a new conversation or messages arrive.
   * Updates internal state and deletes old empty chats if needed.
   * @param newChatId - ID of the new conversation
   * @param newMessages - Array of new posts
   */
  onContentChange(newChatId?: string, newMessages: PostInterface[] = []) {
    const previousChatId = this.currentConversationId;
    this.currentConversationId = newChatId;
    this.postInfo = newMessages;

    if (previousChatId && previousChatId !== newChatId) {
      this.tryDeleteEmptyChat(previousChatId);
    }
  }

  /**
   * Handles a scroll request to a specific post ID.
   * Highlights the post, scrolls to it, and clears the URL param.
   * @param postId - ID of the post to scroll to
   */
  private handleScrollRequest(postId: string) {
    if (!postId) return;
    this.pendingScrollTo = postId;

    const maybe = this.postElements?.find(
      (e) => (e.nativeElement as HTMLElement).id === postId
    );
    if (!maybe) return; // Not yet in DOM

    this.pendingScrollTo = undefined;
    const el = maybe.nativeElement as HTMLElement;

    this.triggerHighlight(el);
    this.scrollIfNeeded(el);

    this.router.navigate([], {
      queryParams: { scrollTo: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /**
   * Triggers a highlight animation on a given post element.
   */
  private triggerHighlight(el: HTMLElement) {
    el.classList.remove('highlight');
    void el.offsetWidth; // force reflow
    el.classList.add('highlight');
    window.setTimeout(() => el.classList.remove('highlight'), 2000);
  }

  /**
   * Finds the scrollable parent element for a given node.
   * @param node - The child element
   * @returns The nearest scrollable parent
   */
  private getScrollParent(node: HTMLElement | null): HTMLElement {
    if (!node)
      return (document.scrollingElement ||
        document.documentElement) as HTMLElement;

    let parent = node.parentElement;
    while (parent) {
      const style = getComputedStyle(parent);
      const overflowY = style.overflowY;
      if (
        (overflowY === 'auto' ||
          overflowY === 'scroll' ||
          overflowY === 'overlay') &&
        parent.scrollHeight > parent.clientHeight
      ) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return (document.scrollingElement ||
      document.documentElement) as HTMLElement;
  }

  /**
   * Checks if an element is fully visible in a scroll container.
   * @param el - The element to check
   * @param container - The scroll container
   */
  private isFullyVisibleInContainer(
    el: HTMLElement,
    container: HTMLElement
  ): boolean {
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    if (
      container === document.scrollingElement ||
      container === document.documentElement ||
      container === document.body
    ) {
      return (
        elRect.top >= 0 &&
        elRect.bottom <=
          (window.innerHeight || document.documentElement.clientHeight)
      );
    } else {
      return (
        elRect.top >= containerRect.top && elRect.bottom <= containerRect.bottom
      );
    }
  }

  /**
   * Scrolls an element into view if it's not already visible.
   * Smooth scrolls and centers the element in the container.
   * @param el - Element to scroll to
   */
  private scrollIfNeeded(el: HTMLElement) {
    const scrollParent = this.getScrollParent(el);
    const alreadyVisible = this.isFullyVisibleInContainer(el, scrollParent);

    if (alreadyVisible) return;

    setTimeout(() => {
      const elRect = el.getBoundingClientRect();
      const parentRect = scrollParent.getBoundingClientRect();

      if (
        scrollParent === document.scrollingElement ||
        scrollParent === document.documentElement ||
        scrollParent === document.body
      ) {
        const absoluteTarget =
          window.pageYOffset +
          elRect.top -
          (window.innerHeight / 2 - el.offsetHeight / 2);
        window.scrollTo({
          top: Math.max(0, absoluteTarget),
          behavior: 'smooth',
        });
      } else {
        const offset = elRect.top - parentRect.top;
        const target = Math.max(
          0,
          scrollParent.scrollTop +
            offset -
            (scrollParent.clientHeight / 2 - el.offsetHeight / 2)
        );
        try {
          scrollParent.scrollTo({ top: target, behavior: 'smooth' });
        } catch {
          scrollParent.scrollTop = target;
        }
      }
    }, 0);
  }

  /**
   * Returns true if the current post has a different creation date
   * than the previous one. Ensures dates are only displayed once per day.
   * @param index - Index of the current post
   */
  shouldShowDate(index: number): boolean {
    if (index > 0) {
      let currentPostDate;
      if (!this.postInfo[index].createdAt) {
        currentPostDate = new Date().toISOString().split('T')[0];
      } else {
        currentPostDate = this.postInfo[index].createdAt
          .toDate()
          .toISOString()
          .split('T')[0];
      }

      let previousPostDate: string;
      if (!this.postInfo[index - 1].createdAt) {
        previousPostDate = new Date().toISOString().split('T')[0];
      } else {
        previousPostDate = this.postInfo[index - 1].createdAt
          .toDate()
          .toISOString()
          .split('T')[0];
      }

      return currentPostDate !== previousPostDate;
    }
    return true;
  }
}
