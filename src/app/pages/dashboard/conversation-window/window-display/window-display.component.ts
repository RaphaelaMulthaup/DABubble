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
import { ChatActiveRouterService } from '../../../../services/chat-active-router.service';
import { tap } from 'rxjs';
import { ChatService } from '../../../../services/chat.service';
import { EmptyChatViewComponent } from './empty-chat-view/empty-chat-view.component';

@Component({
  selector: 'app-window-display', // Component selector used in parent templates
  imports: [DisplayedPostComponent, CommonModule, EmptyChatViewComponent], // Imports child component to display individual messages
  templateUrl: './window-display.component.html', // External HTML template
  styleUrl: './window-display.component.scss', // SCSS styles for this component
})
export class WindowDisplayComponent {
  @Input() messages$!: import('rxjs').Observable<PostInterface[]>;
  // an array with all posts in this conversation
  postInfo: PostInterface[] = [];
  currentChatId?: string; // <-- currently displayed chat
  @ViewChildren(DisplayedPostComponent, { read: ElementRef })
  postElements!: QueryList<ElementRef>;

  // an array with all the days of the week to show when a post was created
  days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  private pendingScrollTo?: string; // stores the post id to scroll to
  private destroy$ = new Subject<void>(); // for cleaning up subscriptions

  constructor(
    private el: ElementRef,
    private route: ActivatedRoute,
    private router: Router,
    public postService: PostService,
    private chatService: ChatService
  ) {}

  /**
   * Subscribe to the BehaviorSubject from PostService
   * Keeps 'messages' updated with the latest conversation in real-time
   */
  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const chatId = params['conversationId']; // get chat id from route params
      this.currentChatId = chatId;
    });

    this.messages$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      // Update content when new messages are received
      this.onContentChange(
        this.currentChatId, // new chat ID
        data // new messages
      );
    });

    // Subscribe to selected post service to handle scroll requests
    this.postService.selected$
      .pipe(takeUntil(this.destroy$))
      .subscribe((postId) => {
        this.handleScrollRequest(postId);
      });

    // Subscribe to queryParams (for links/bookmarks)
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const id = params['scrollTo'];
        if (id) this.handleScrollRequest(id);
      });
  }

  ngAfterViewInit() {
    // If new ViewChildren come (e.g., after lazy loading), try the pending scroll ID
    this.postElements.changes.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.pendingScrollTo) {
        this.handleScrollRequest(this.pendingScrollTo);
      }
    });

    // If there's already a scrollTo in the URL when the component renders, handle it
    const initial = this.route.snapshot.queryParams['scrollTo'];
    if (initial) this.handleScrollRequest(initial);
  }

  ngOnDestroy() {
    // Cleanup on component destroy
    this.tryDeleteEmptyChat(this.currentChatId);
    this.destroy$.next();
    this.destroy$.complete();
  }

  private tryDeleteEmptyChat(chatId?: string): void {
    // If the chat is empty, try to delete it from the chat service
    if (chatId && this.postInfo.length === 0) {
      this.chatService
        .deleteChat(chatId)
        .then(() => console.log(`Empty chat ${chatId} deleted`))
        .catch((err) => console.error('Error deleting chat', err));
    }
  }

  /**
   * Called when new content is loaded (e.g., different chat or channel)
   * @param newChatId The new chat ID
   * @param newMessages The new set of messages
   */
  onContentChange(newChatId?: string, newMessages: PostInterface[] = []) {
    const previousChatId = this.currentChatId;

    // Update data
    this.currentChatId = newChatId;
    this.postInfo = newMessages;

    // If the chat has changed, try to delete the previous chat
    if (previousChatId && previousChatId !== newChatId) {
      this.tryDeleteEmptyChat(previousChatId);
    }
  }

  private handleScrollRequest(postId: string) {
    if (!postId) return;
    this.pendingScrollTo = postId;

    // Try to find the post element
    const maybe = this.postElements?.find(
      (e) => (e.nativeElement as HTMLElement).id === postId
    );
    if (!maybe) {
      // Not in the DOM yet, so try later
      return;
    }
    this.pendingScrollTo = undefined;
    const el = maybe.nativeElement as HTMLElement;

    // 1) Trigger highlight effect
    this.triggerHighlight(el);

    // 2) Scroll to the post if needed
    this.scrollIfNeeded(el);

    // 3) Remove scroll-parameter from the URL
    this.router.navigate([], {
      queryParams: { scrollTo: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private triggerHighlight(el: HTMLElement) {
    // Remove & reflow & add class to trigger animation
    el.classList.remove('highlight');
    void el.offsetWidth; // force reflow
    el.classList.add('highlight');
    window.setTimeout(() => el.classList.remove('highlight'), 2000);
  }

  private getScrollParent(node: HTMLElement | null): HTMLElement {
    // Determine the scroll parent for the element
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

  private isFullyVisibleInContainer(
    el: HTMLElement,
    container: HTMLElement
  ): boolean {
    // Check if the element is fully visible in its scroll container
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

  private scrollIfNeeded(el: HTMLElement) {
    // Determine if scrolling is needed
    const scrollParent = this.getScrollParent(el);
    const alreadyVisible = this.isFullyVisibleInContainer(el, scrollParent);

    if (alreadyVisible) {
      // Already visible → Highlight will show anyway
      return;
    }

    // Delay scroll to allow DOM stabilization
    setTimeout(() => {
      const elRect = el.getBoundingClientRect();
      const parentRect = scrollParent.getBoundingClientRect();

      if (
        scrollParent === document.scrollingElement ||
        scrollParent === document.documentElement ||
        scrollParent === document.body
      ) {
        // Scroll the window
        const absoluteTarget =
          window.pageYOffset +
          elRect.top -
          (window.innerHeight / 2 - el.offsetHeight / 2);
        window.scrollTo({
          top: Math.max(0, absoluteTarget),
          behavior: 'smooth',
        });
      } else {
        // Scroll the parent element
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
    }, 0); // 0ms is enough to stabilize the Angular layout
  }

  /**
   * This function returns true when the creation-date of a post is not equal to the creation-date of the previous post.
   * This way, the creation-date is only shown when a message is the first one with that creation-date.
   *
   * @param index the index of the post
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
