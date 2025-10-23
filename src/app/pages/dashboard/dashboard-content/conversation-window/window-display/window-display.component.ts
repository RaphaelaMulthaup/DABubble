import { Component, ElementRef, Input, OnInit, QueryList, ViewChild, ViewChildren, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService } from '../../../../../services/post.service';
import { DisplayedPostComponent } from './displayed-post/displayed-post.component';
import { PostInterface } from '../../../../../shared/models/post.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, combineLatest, defer, distinctUntilChanged, map, Observable, of, shareReplay, startWith, Subject, takeUntil } from 'rxjs';
import { ConversationActiveRouterService } from '../../../../../services/conversation-active-router.service';
import { ChatService } from '../../../../../services/chat.service';
import { DashboardState } from '../../../../../shared/types/dashboard-state.type';
import { ScreenSize } from '../../../../../shared/types/screen-size.type';
import { ScreenService } from '../../../../../services/screen.service';
import { DAYS } from '../../../../../shared/constants/days';
import { EmptyChatViewComponent } from './empty-chat-view/empty-chat-view.component';
import { EmptyChannelViewComponent } from './empty-channel-view/empty-channel-view.component';
import { EmptyThreadViewComponent } from './empty-thread-view/empty-thread-view.component';
import { doc, docData, Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-window-display',
  imports: [ DisplayedPostComponent, CommonModule, EmptyChatViewComponent, EmptyChannelViewComponent, EmptyThreadViewComponent ],
  templateUrl: './window-display.component.html',
  styleUrl: './window-display.component.scss',
})
export class WindowDisplayComponent implements OnInit {
  @Input() messages$!: Observable<PostInterface[]>;
  @Input() conversationWindowState?: 'conversation' | 'thread';

  @ViewChildren(DisplayedPostComponent, { read: ElementRef }) postElements!: QueryList<ElementRef>;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChildren('messageElement', { read: ElementRef }) messageElements!: QueryList<ElementRef>;

  dashboardState: WritableSignal<DashboardState>;
  channelTyp$?: Observable<string>;
  screenSize$!: Observable<ScreenSize>;
  isLoaded$!: Observable<boolean>;
  destroy$ = new Subject<void>();
  days = DAYS;

  postAnsweredId!: string | null;
  postAnswered!: PostInterface | null;
  postAnswered$!: Observable <PostInterface | null>;
  postInfo: PostInterface[] = [];
  currentConversationType?: 'channel' | 'chat';
  loadingOlderMessages = false;
  initialScrollDone = false;
  hasScrollbar = false;
  previousScrollHeight = 0;
  currentConversationId?: string;
  lastconversationId?: string;
  pendingScrollTo?: string;

  constructor(
    private chatService: ChatService,
    private conversationActiveRouterService: ConversationActiveRouterService,
    private firestore: Firestore,
    public postService: PostService,
    private route: ActivatedRoute,
    private router: Router,
    public screenService: ScreenService
  ) {
    this.dashboardState = this.screenService.dashboardState;
    this.screenSize$ = this.screenService.screenSize$;
    if (this.postAnswered) this.postAnswered$ = docData(doc(this.firestore, `channels/${this.currentConversationId}/messages/${this.postAnswered.id}`)) as Observable<PostInterface>;
  }

  ngOnInit() {
    this.initConversationRouteParams();
    this.initAnsweredPostTracking();
    this.initMessageSubscription();
    this.initScrollHandlers();
    this.initLoadingState();
      this.postService.newMessage$.pipe(takeUntil(this.destroy$)).subscribe(() => {
    setTimeout(() => this.scrollToLastMessage(), 0);
  });
  }

  ngAfterViewInit() {
    this.tryAutoLoadUntilScrollbar()
    this.postElements.changes.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.pendingScrollTo) this.handleScrollRequest( this.pendingScrollTo, this.currentConversationId);
    });
    const initial = this.route.snapshot.queryParams['scrollTo'];
    if (initial) this.handleScrollRequest(initial, this.currentConversationId);
  }

  ngOnDestroy() {
    this.tryDeleteEmptyChat(this.currentConversationId);
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribes to route params and updates conversation type and ID.
   */
  initConversationRouteParams() {
    this.channelTyp$ = this.conversationActiveRouterService.getConversationType$(this.route);
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.currentConversationId = params['conversationId'];
      this.currentConversationType = params['conversationType'];
    });
  }

  /**
   * Tracks the 'messageId' route param and loads the answered post if present.
   */
  initAnsweredPostTracking() {
    this.route.params
      .pipe(
        map((params) => params['messageId'] ?? null),
        distinctUntilChanged(),
        takeUntil(this.destroy$))
      .subscribe((messageId) => { this.postAnsweredId = messageId;
        if (this.postAnsweredId) { this.postService
            .getPostById( this.currentConversationType!, this.currentConversationId!, this.postAnsweredId!)
            .pipe(takeUntil(this.destroy$))
            .subscribe((post) => (this.postAnswered = post));
        } else this.postAnswered = null;
      });
  }

  /**
   * Subscribes to messages and handles scroll restoration or auto-scroll.
   */
  initMessageSubscription() {
    this.messages$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.onContentChange(this.currentConversationId, data);
      const el = this.messagesContainer.nativeElement;
      if (this.loadingOlderMessages) {
        const offset = 20;
        const newScrollHeight = el.scrollHeight;
        el.scrollTop = newScrollHeight - this.previousScrollHeight + offset;
        this.loadingOlderMessages = false;
      } else if (!this.initialScrollDone) {
        setTimeout(() => this.scrollToLastMessage());
        this.initialScrollDone = true;
      }
    });
  }

  /**
   * Handles automatic scrolling based on selected post or query params.
   */
  initScrollHandlers() {
    this.postService.selected$
      .pipe(takeUntil(this.destroy$))
      .subscribe((postId) => {this.handleScrollRequest(postId, this.currentConversationId)});
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const id = params['scrollTo'];
        if (id) this.handleScrollRequest(id, this.currentConversationId);
      });
  }

  /**
   * Initializes observable that tracks whether messages and channel are loaded.
   */
  initLoadingState() {
    this.isLoaded$ = defer(() => {
      if (!this.messages$) return of(true);
      return combineLatest([this.messages$, this.channelTyp$ ?? of(true)]).pipe(
        map(([messages]) => messages !== undefined && messages !== null),
        distinctUntilChanged(),
        startWith(false),
        catchError(() => of(true)),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    });
  }

  /**
   * Determines whether the thread theme should be displayed.
   * Returns `true` only if the current window state is a thread, a `postAnswered` object exists and the post has no answers (`ansCounter` is 0 or undefined).
   */
  showThreadTheme():boolean {
    if (this.conversationWindowState === 'conversation') return false;
    if (!this.postAnswered) return false;
    if (this.postAnswered.ansCounter && this.postAnswered.ansCounter > 0) return false;
    return true;
  }

  /**
   * Attempts to automatically load more messages until a scrollbar appears
   * or the maximum number of tries is reached.
   */
  async tryAutoLoadUntilScrollbar() {
    const el = this.messagesContainer.nativeElement;
    let iteration = 0;
    const maxTries = 5;
    if (iteration === 5) return;
    while (el.scrollHeight <= el.clientHeight && iteration < maxTries) {
      iteration++;
      this.loadingOlderMessages = true;
      await this.conversationActiveRouterService.loadMore(this.currentConversationId!);
      await new Promise((resolve) => setTimeout(resolve, 300));
      this.loadingOlderMessages = false;
    }
  }

  /**
   * Handles scroll events to implement infinite scroll for chat messages.
   * Loads older messages when the user scrolls near the top of the container.
   * Prevents duplicate loads and stops if all messages are already loaded.
   */
  onScroll() {
    const el = this.messagesContainer.nativeElement;
    const threshold = 20;
    if (el.scrollTop <= threshold && !this.loadingOlderMessages) {
      if ( this.conversationActiveRouterService.allMessagesLoaded.get( this.currentConversationId!)) return;
      this.previousScrollHeight = el.scrollHeight;
      this.loadingOlderMessages = true;
      this.conversationActiveRouterService.loadMore(this.currentConversationId!);
    }
  }

  /**
   * Scrolls the view to the last message element in the message list.
   * Marks that the initial scroll has been performed.
   */
  scrollToLastMessage() {
    const messagesArray = this.messageElements?.toArray();
    if (!messagesArray?.length) return;
    const lastMessage = messagesArray[messagesArray.length - 1].nativeElement;
    lastMessage.scrollIntoView({ block: 'end', behavior: 'auto' });
    this.initialScrollDone = true;
  }

  /**
   * Try to delete the chat if it has no messages.
   *
   * @param chatId - ID of the chat to delete
   */
  tryDeleteEmptyChat(chatId?: string) {
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
   *
   * @param newChatId - ID of the new conversation
   * @param newMessages - Array of new posts
   */
  onContentChange(newChatId?: string, newMessages: PostInterface[] = []) {
    const previousChatId = this.currentConversationId;
    this.currentConversationId = newChatId;
    this.postInfo = newMessages;

    if (previousChatId && previousChatId !== newChatId) {
      this.initialScrollDone = false;
      this.loadingOlderMessages = false;
      this.tryDeleteEmptyChat(previousChatId);
      setTimeout(() => this.scrollToLastMessage(), 0);
          return;
    } else if (!this.loadingOlderMessages && !this.initialScrollDone) {
      setTimeout(() => this.scrollToLastMessage(), 0);
      this.initialScrollDone = true;
    }
     const el = this.messagesContainer.nativeElement;

    if (el.scrollTop === 0 && this.postInfo.length > 0 && !this.loadingOlderMessages) {
      setTimeout(() => this.scrollToLastMessage(), 0);
    }
  }

  /**
   * Attempts to scroll to a specific post by its ID, retrying if the element is not yet rendered.
   * Loads more messages from the conversation if needed.
   *
   * @param postId - ID of the post to scroll to
   * @param conversationId - Optional ID of the conversation containing the post
   */
  async handleScrollRequest(postId: string, conversationId?: string) {
    if (!postId) return;
    this.pendingScrollTo = postId;
    const maxRetries = 20;
    const retryDelay = 300;
    for (let i = 0; i < maxRetries; i++) {
      const foundPost = this.postElements?.find((e) => (e.nativeElement as HTMLElement).id === postId);
      if (foundPost) {
        this.handleFoundPost(foundPost);
        break;
      }
      this.conversationActiveRouterService.loadMore(conversationId!);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  /**
   * Handles a post element once it has been found for scrolling.
   * Highlights the element, scrolls to it if necessary, and clears the scroll query parameter.
   *
   * @param foundPost - The ElementRef of the post to handle
   */
  handleFoundPost(foundPost: ElementRef<HTMLElement>) {
    this.pendingScrollTo = undefined;
    const el = foundPost.nativeElement as HTMLElement;
    this.triggerHighlight(el);
    this.scrollIfNeeded(el);
    this.router.navigate([], {
      queryParams: { scrollTo: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /**
   * Temporarily highlights an element by adding a CSS class.
   * The highlight is automatically removed after 2 seconds.
   *
   * @param el - The HTML element to highlight
   */
  triggerHighlight(el: HTMLElement) {
    el.classList.remove('highlight');
    void el.offsetWidth;
    el.classList.add('highlight');
    window.setTimeout(() => el.classList.remove('highlight'), 2000);
  }

  /**
   * Scrolls the element into view if it is not fully visible.
   *
   * @param el - The element to scroll to
   */
  scrollIfNeeded(el: HTMLElement) {
    const scrollParent = this.getScrollParent(el);
    if (this.isFullyVisibleInContainer(el, scrollParent)) return;
    setTimeout(() => {
      if ( scrollParent === document.scrollingElement || scrollParent === document.documentElement || scrollParent === document.body) {
        this.scrollWindowToElement(el);
      } else this.scrollContainerToElement(el, scrollParent);
    }, 0);
  }

  /**
   * Finds the scrollable parent element for a given node.
   * Returns the nearest scrollable parent.
   *
   * @param node - The child element
   */
  getScrollParent(node: HTMLElement | null): HTMLElement {
    if (!node) return (document.scrollingElement || document.documentElement) as HTMLElement;
    let parent = node.parentElement;
    while (parent) {
      const style = getComputedStyle(parent);
      const overflowY = style.overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') && parent.scrollHeight > parent.clientHeight) return parent
      parent = parent.parentElement;
    }
    return (document.scrollingElement || document.documentElement) as HTMLElement;
  }

  /**
   * Checks if an element is fully visible in a scroll container.
   *
   * @param el - The element to check
   * @param container - The scroll container
   */
  isFullyVisibleInContainer(el: HTMLElement, container: HTMLElement): boolean {
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    if ( container === document.scrollingElement || container === document.documentElement || container === document.body) {
      return ( elRect.top >= 0 && elRect.bottom <= (window.innerHeight || document.documentElement.clientHeight));
    } else return (elRect.top >= containerRect.top && elRect.bottom <= containerRect.bottom);
  }

  /**
   * Smoothly scrolls the window to center the target element.
   *
   * @param el - The element to scroll to.
   */
  scrollWindowToElement(el: HTMLElement) {
    const elRect = el.getBoundingClientRect();
    const absoluteTarget = window.pageYOffset + elRect.top - (window.innerHeight / 2 - el.offsetHeight / 2);
    window.scrollTo({ top: Math.max(0, absoluteTarget), behavior: 'smooth' });
  }

  /**
   * Smoothly scrolls a container to center the target element.
   * Falls back to direct scrollTop assignment if smooth scrolling fails.
   *
   * @param el - The element to scroll to.
   * @param container - The scrollable container.
   */
  scrollContainerToElement(el: HTMLElement, container: HTMLElement) {
    const elRect = el.getBoundingClientRect();
    const parentRect = container.getBoundingClientRect();
    const target = Math.max( 0, container.scrollTop + (elRect.top - parentRect.top) - (container.clientHeight / 2 - el.offsetHeight / 2));
    try { container.scrollTo({ top: target, behavior: 'smooth' }) }
    catch { container.scrollTop = target }
  }

  /**
   * Returns true if the current post has a different creation date than the previous one. Ensures dates are only displayed once per day.
   *
   * @param index - Index of the current post
   */
  shouldShowDate(index: number): boolean {
    if (index > 0) {
      const currentPostDate: string = this.currentPostDate(index);
      const previousPostDate: string = this.previousPostDate(index);
      return currentPostDate !== previousPostDate;
    } else return true;
  }

  /**
   * Returns the date (YYYY-MM-DD) of the previous post in the list. If the previous post has no creation date, uses today's date.
   *
   * @param index - The index of the current post
   */
  previousPostDate(index: number): string {
    let previousPostDate: string;
    if (!this.postInfo[index - 1].createdAt) {
      previousPostDate = new Date().toISOString().split('T')[0];
    } else {
      previousPostDate = this.postInfo[index - 1].createdAt
        .toDate()
        .toISOString()
        .split('T')[0];
    }
    return previousPostDate;
  }

  /**
   * Returns the date (YYYY-MM-DD) of the current post. If the post has no creation date, uses today's date.
   *
   * @param index - The index of the current post
   */
  currentPostDate(index: number): string {
    let currentPostDate;
    if (!this.postInfo[index].createdAt) {
      currentPostDate = new Date().toISOString().split('T')[0];
    } else {
      currentPostDate = this.postInfo[index].createdAt
        .toDate()
        .toISOString()
        .split('T')[0];
    }
    return currentPostDate;
  }
}
