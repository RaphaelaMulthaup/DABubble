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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, Observable, Subscription, switchMap } from 'rxjs';
import { ChatActiveRouterService } from '../../../../services/chat-active-router.service';
import { tap } from 'rxjs';

@Component({
  selector: 'app-window-display', // Component selector used in parent templates
  imports: [DisplayedPostComponent, CommonModule], // Imports child component to display individual messages
  templateUrl: './window-display.component.html', // External HTML template
  styleUrl: './window-display.component.scss', // SCSS styles for this component
})
export class WindowDisplayComponent {
  @Input() messages$!: import('rxjs').Observable<PostInterface[]>;

  //an array with all posts in this conversation
  postInfo: PostInterface[] = [];

  @ViewChildren(DisplayedPostComponent, { read: ElementRef })
  postElements!: QueryList<ElementRef>;

  // // Inject PostService to receive and manage displayed messages
  // postService = inject(PostService);
  // //hier is a stream of messages
  // messages$!: Observable<PostInterface[]>;
  // private route = inject(ActivatedRoute);
  // private chatActiveRouterService = inject(ChatActiveRouterService);
  private route = inject(ActivatedRoute);
  public postService = inject(PostService);

  //an array with all the days of the week, to show that one a post was created
  days = [
    'Sonntag',
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag',
    'Samstag',
  ];

  constructor(private el: ElementRef) {}
  private subs: Subscription[] = [];
  private pendingScrollTo?: string;
  /**
   * Subscribe to the BehaviorSubject from PostService
   * Keeps 'messages' updated with the latest conversation in real-time
   */
  ngOnInit() {
    // Deine bestehende messages$-Subscription
    this.subs.push(
      this.messages$.subscribe((data) => {
        this.postInfo = data;
        this.postInfo.sort((a: any, b: any) => a.createdAt - b.createdAt);
      })
    );

    // Subscription auf service → immer feuern, auch bei "gleicher" URL
    this.subs.push(
      this.postService.selected$.subscribe((postId) => {
        this.handleScrollRequest(postId);
      })
    );

    // Subscription auf queryParams (für Links / Bookmark)
    this.subs.push(
      this.route.queryParams.subscribe((params) => {
        const id = params['scrollTo'];
        if (id) this.handleScrollRequest(id);
      })
    );
  }
  ngAfterViewInit() {
    // Wenn neue ViewChildren kommen (z. B. nach nachladen), versuche pending id
    this.subs.push(
      this.postElements.changes.subscribe(() => {
        if (this.pendingScrollTo) {
          this.handleScrollRequest(this.pendingScrollTo);
        }
      })
    );
    // Falls beim ersten Rendern schon eine scrollTo im URL ist
    const initial = this.route.snapshot.queryParams['scrollTo'];
    if (initial) this.handleScrollRequest(initial);
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }

  private handleScrollRequest(postId: string) {
    if (!postId) return;
    this.pendingScrollTo = postId;
    const maybe = this.postElements?.find(
      (e) => (e.nativeElement as HTMLElement).id === postId
    );
    if (!maybe) {
      // noch nicht im DOM → wird beim postElements.changes erneut versucht
      return;
    }
    this.pendingScrollTo = undefined;
    const el = maybe.nativeElement as HTMLElement;

    // 1) Highlight immer neu triggern
    this.triggerHighlight(el);

    // 2) Scrollen nur, wenn nicht sichtbar (relativ zum scrollParent)
    this.scrollIfNeeded(el);
  }

  private triggerHighlight(el: HTMLElement) {
    // Entfernen & Reflow & hinzufügen, damit Animation neu abläuft
    el.classList.remove('highlight');
    void el.offsetWidth; // force reflow
    el.classList.add('highlight');
    window.setTimeout(() => el.classList.remove('highlight'), 2000);
  }

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

  private scrollIfNeeded(el: HTMLElement) {
    const scrollParent = this.getScrollParent(el);
    const alreadyVisible = this.isFullyVisibleInContainer(el, scrollParent);
    if (alreadyVisible) {
      // bereits sichtbar → wir wollen nur das Highlight zeigen (bereits passiert)
      return;
    }

    // compute a scroll target that centers the element inside the scrollParent
    const elRect = el.getBoundingClientRect();
    const parentRect = scrollParent.getBoundingClientRect();

    if (
      scrollParent === document.scrollingElement ||
      scrollParent === document.documentElement ||
      scrollParent === document.body
    ) {
      // scroll window
      const absoluteTarget =
        window.pageYOffset +
        elRect.top -
        (window.innerHeight / 2 - el.offsetHeight / 2);
      window.scrollTo({ top: Math.max(0, absoluteTarget), behavior: 'smooth' });
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
  }
  // ngOnInit() {
  //   this.messages$ = this.chatActiveRouterService.getParams$(this.route).pipe(
  //     tap((params) => console.log('PARAMS from service:', params)),
  //     switchMap(({ type, id }) => this.chatActiveRouterService.getMessages(type, id))
  //   );
  // }

  /**
   * This function returns true when the creation-date of a post is not equal to the creation-date of the previous post.
   * This way, the creation-date is only shown, when a message is the first one with that creation-date.
   *
   * @param index the index of the post
   */
  shouldShowDate(index: number): boolean {
    if (index > 0) {
      let currentPostDate = this.postInfo[index].createdAt
        .toDate()
        .toISOString()
        .split('T')[0];
      let previousPostDate = this.postInfo[index - 1].createdAt
        .toDate()
        .toISOString()
        .split('T')[0];
      return currentPostDate !== previousPostDate;
    }
    return true;
  }
}
