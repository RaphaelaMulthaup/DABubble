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
import { AuthService } from '../../../services/auth.service';
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
    private authService: AuthService,
    private conversationActiveRouterService: ConversationActiveRouterService,
    public overlayService: OverlayService,
    private route: ActivatedRoute,
    public screenService: ScreenService
  ) {
    this.dashboardState = this.screenService.dashboardState;
    this.screenSize$ = this.screenService.screenSize$;
  }

  ngOnInit() {
    // Initialize dashboardState with the value from the MobileService
    // Set up the observable for fetching messages from the active conversation
    this.messages$ = this.route.paramMap.pipe(
      map((params) => ({
        conversationType: params.get('conversationType'),
        conversationId: params.get('conversationId'),
      })),
      // Ensure conversation type and ID are distinct before triggering the fetch
      distinctUntilChanged(
        (a, b) =>
          a.conversationType === b.conversationType &&
          a.conversationId === b.conversationId
      ),
      // Ensure valid conversationType and conversationId
      filter(
        ({ conversationType, conversationId }) =>
          !!conversationType && !!conversationId
      ),
      // Fetch messages for the active conversation from the service
      switchMap(({ conversationType, conversationId }) => {
        this.conversationActiveRouterService.resetConversation(conversationId!);
        return this.conversationActiveRouterService.getMessages(
          conversationType!,
          conversationId!
        );
      }),
      // Share the last value and maintain a reference count to avoid multiple fetches
      shareReplay({ bufferSize: 1, refCount: true })
    );

    // Set up the observable for fetching answers to a particular message in the conversation
    this.answers$ = this.route.paramMap.pipe(
      map((params) => ({
        conversationType: params.get('conversationType'),
        conversationId: params.get('conversationId'),
        messageId: params.get('messageId'),
      })),
      // Ensure conversation and message IDs are distinct before triggering the fetch
      distinctUntilChanged(
        (a, b) =>
          a.conversationType === b.conversationType &&
          a.conversationId === b.conversationId &&
          a.messageId === b.messageId
      ),
      // Ensure valid conversationType, conversationId, and messageId
      filter(
        ({ conversationType, conversationId, messageId }) =>
          !!conversationType && !!conversationId && !!messageId
      ),
      // Fetch answers to a particular message
      switchMap(({ conversationType, conversationId, messageId }) =>
        this.conversationActiveRouterService.getAnswers(
          conversationType!,
          conversationId!,
          messageId!
        )
      ),
      // Share the last value and maintain a reference count to avoid multiple fetches
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  onResultsChanged(results: SearchResult[]) {
    this.results$.next(results);
  }

  onHasInputChange(hasInput: boolean) {
    this.hasInput = hasInput;
  }
}
