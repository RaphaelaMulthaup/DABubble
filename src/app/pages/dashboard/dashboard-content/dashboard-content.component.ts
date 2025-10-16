import { Component, OnInit, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardState } from '../../../shared/types/dashboard-state.type';
import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  shareReplay,
  switchMap,
} from 'rxjs';
import { ScreenSize } from '../../../shared/types/screen-size.type';
import { ScreenService } from '../../../services/screen.service';
import { PostInterface } from '../../../shared/models/post.interface';
import { SearchResult } from '../../../shared/types/search-result.type';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { OverlayService } from '../../../services/overlay.service';
import { ConversationActiveRouterService } from '../../../services/conversation-active-router.service';
import { HeaderSearchbarComponent } from './header-searchbar/header-searchbar.component';
import { SearchResultsNewMessageComponent } from '../../../overlay/search-results-new-message/search-results-new-message.component';
import { ConversationWindowComponent } from './conversation-window/conversation-window.component';

@Component({
  selector: 'app-dashboard-content',
  imports: [
    CommonModule,
    HeaderSearchbarComponent,
    SearchResultsNewMessageComponent,
    ConversationWindowComponent,
  ],
  templateUrl: './dashboard-content.component.html',
  styleUrl: './dashboard-content.component.scss',
})
export class DashboardContentComponent implements OnInit {
  dashboardState!: WritableSignal<DashboardState>;
  screenSize$!: Observable<ScreenSize>;
  messages$!: Observable<PostInterface[]>;
  answers$!: Observable<PostInterface[]>;
  results$ = new BehaviorSubject<SearchResult[]>([]);
  resultsSignal = toSignal(this.results$.asObservable(), { initialValue: [] });
  hasInput: boolean = false;

  constructor(
    private conversationActiveRouterService: ConversationActiveRouterService,
    public overlayService: OverlayService,
    private route: ActivatedRoute,
    public screenService: ScreenService
  ) {
    this.dashboardState = this.screenService.dashboardState;
    this.screenSize$ = this.screenService.screenSize$;
  }

  ngOnInit() {
    this.messages$ = this.initMessagesStream();
    this.answers$ = this.initAnswersStream();
  }

  /**
   * Initializes the message stream based on the active route parameters.
   * Reacts to changes in conversation type or ID and fetches messages accordingly.
   */
  initMessagesStream(): Observable<any[]> {
    return this.route.paramMap.pipe(
      map((params) => ({
        type: params.get('conversationType'),
        id: params.get('conversationId'),
      })),
      filter(({ type, id }) => !!type && !!id),
      distinctUntilChanged((a, b) => a.type === b.type && a.id === b.id),
      switchMap(({ type, id }) =>
        this.conversationActiveRouterService.getMessages(type!, id!)
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Initializes the answer stream based on the active route parameters.
   * Reacts to changes in conversation type, ID, or message ID and fetches answers accordingly.
   */
  initAnswersStream(): Observable<any[]> {
    return this.route.paramMap.pipe(
      map((params) => ({
        type: params.get('conversationType'),
        id: params.get('conversationId'),
        msgId: params.get('messageId'),
      })),
      filter(({ type, id, msgId }) => !!type && !!id && !!msgId),
      distinctUntilChanged((a, b) => a.type === b.type && a.id === b.id && a.msgId === b.msgId),
      switchMap(({ type, id, msgId }) => this.conversationActiveRouterService.getAnswers(type!, id!, msgId!)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Updates the search results stream with new result data.
   *
   * @param results - Array with search results.
   */
  onResultsChanged(results: SearchResult[]) {
    this.results$.next(results);
  }

  /**
   * Toggles the hasInput-variable.
   *
   * @param hasInput - a boolean indicating whether an input is there or not.
   */
  onHasInputChange(hasInput: boolean) {
    this.hasInput = hasInput;
  }
}
