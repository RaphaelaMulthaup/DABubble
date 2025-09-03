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
import { map, Observable, Subscription, switchMap } from 'rxjs';
import { ChatActiveRouterService } from '../../../../services/chat-active-router.service';
import { tap } from 'rxjs';
import { ChatService } from '../../../../services/chat.service';

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
  currentChatId?: string; // <-- aktuell angezeigter Chat
  @ViewChildren(DisplayedPostComponent, { read: ElementRef })
  postElements!: QueryList<ElementRef>;

  // // Inject PostService to receive and manage displayed messages
  // postService = inject(PostService);
  // //hier is a stream of messages
  // messages$!: Observable<PostInterface[]>;
  // private route = inject(ActivatedRoute);
  // private chatActiveRouterService = inject(ChatActiveRouterService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public postService = inject(PostService);
  chatService = inject(ChatService);

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
      this.route.params.subscribe((params) => {
        const chatId = params['id']; // oder wie dein Param heißt
        this.currentChatId = chatId;
      })
    );
    this.subs.push(
      this.messages$.subscribe((data) => {
        this.onContentChange(
          this.currentChatId, // neue ID
          data // neue Nachrichten
        );
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
  ngOnDestroy() {
    //Ich glaube der Aufruf von tryDeleteEmptyChat ist hier nicht nötig und reicht in onContentChange
    // this.tryDeleteEmptyChat(); // Letzten angezeigten Chat prüfen
    this.subs.forEach((s) => s.unsubscribe());
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
  private tryDeleteEmptyChat(previousChatId?: string): void {
    const idToDelete = previousChatId ?? this.currentChatId;
    if (idToDelete && this.postInfo.length === 0) {
      this.chatService
        .deleteChat(idToDelete)
        .then(() => console.log(`Leerer Chat ${idToDelete} gelöscht`))
        .catch((err) => console.error('Fehler beim Löschen des Chats', err));
    }
  }
  /**
   * Aufruf, wenn neue Inhalte geladen werden (z. B. anderer Chat oder Channel)
   */
  onContentChange(newChatId?: string, newMessages: PostInterface[] = []) {
    const previousChatId = this.currentChatId;

    // neue Daten übernehmen
    this.currentChatId = newChatId;
    this.postInfo = newMessages;

    // Alten Chat prüfen und ggf. löschen
    this.tryDeleteEmptyChat(previousChatId);
  }
  private handleScrollRequest(postId: string) {
    if (!postId) return;
    this.pendingScrollTo = postId;
    const maybe = this.postElements?.find(
      (e) => (e.nativeElement as HTMLElement).id === postId
    );
    if (!maybe) {
      // noch nicht im DOM → später versuchen
      return;
    }
    this.pendingScrollTo = undefined;
    const el = maybe.nativeElement as HTMLElement;

    // 1) Highlight
    this.triggerHighlight(el);

    // 2) Scrollen
    this.scrollIfNeeded(el);

    // 3) Scroll-Param aus URL entfernen
    this.router.navigate([], {
      queryParams: { scrollTo: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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
      // bereits sichtbar → Highlight wird sowieso gezeigt
      return;
    }

    // scroll verzögern, damit DOM stabil ist
    setTimeout(() => {
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
        window.scrollTo({
          top: Math.max(0, absoluteTarget),
          behavior: 'smooth',
        });
      } else {
        // scroll parent element
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
    }, 0); // 0ms reicht, um Angular Layout stabilisieren zu lassen
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
