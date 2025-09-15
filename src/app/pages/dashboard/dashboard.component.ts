import { Component, WritableSignal } from '@angular/core';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { SidenavComponent } from './sidenav/sidenav.component';
import { ConversationWindowComponent } from './conversation-window/conversation-window.component';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../services/overlay.service';
import {
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs/operators';
import { HeaderDashboardComponent } from './header-dashboard/header-dashboard.component';
import { ConversationActiveRouterService } from '../../services/conversation-active-router.service';
import { ActivatedRoute } from '@angular/router';
import { Observable, throwError, EMPTY } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { MobileDashboardState } from '../../shared/types/mobile-dashboard-state.type';
import { ChatService } from '../../services/chat.service';
import { MobileService } from '../../services/mobile.service';
import { PostInterface } from '../../shared/models/post.interface';
import { HeaderSearchbarComponent } from './header-searchbar/header-searchbar.component';

/**
 * The DashboardComponent represents the main view of the dashboard.
 * It contains the sidebar, conversation window, and message threads.
 * It also manages the state of the mobile dashboard, routing to the correct messages and answers.
 */
@Component({
  selector: 'app-dashboard', // The component selector used in HTML
  // Imports necessary child components used inside the dashboard
  imports: [
    SidenavComponent, // Sidebar component
    ConversationWindowComponent, // Component to display the conversation
    CommonModule, // Angular common module for essential directives and pipes
    HeaderDashboardComponent,
    HeaderSearchbarComponent,
  ],
  templateUrl: './dashboard.component.html', // HTML template for the dashboard
  styleUrl: './dashboard.component.scss', // Styles for the dashboard
})
export class DashboardComponent {
  /**
   * A signal representing the state of the mobile dashboard.
   * This will allow updating and reflecting the dashboard's mobile state.
   */
  mobileDashboardState!: WritableSignal<MobileDashboardState>;
  // A flag indicating whether the application is in mobile view.
  isMobile = false;
  // Function to update the `isMobile` flag based on window size.
  private updateMobile: () => void;
  /**
   * Observable that holds the messages in the active conversation.
   * The messages are fetched based on the `conversationType` and `conversationId`.
   */
  messages$!: Observable<PostInterface[]>;

  /**
   * Observable that holds the answers for a particular message in the conversation.
   * The answers are fetched based on the `conversationType`, `conversationId`, and `messageId`.
   */
  answers$!: Observable<PostInterface[]>;

  constructor(
    public overlayService: OverlayService, // Service to handle overlay state
    private authService: AuthService, // Service for authentication management
    private conversationActiveRouterService: ConversationActiveRouterService, // Service for managing active chats
    private route: ActivatedRoute, // To access route parameters for conversation information
    private mobileService: MobileService // Service to manage mobile dashboard state
  ) {
    // Initializing the function to update mobile view state based on window size
    this.updateMobile = () => {
      this.isMobile = this.mobileService.isMobile();
    };
    this.isMobile = this.mobileService.isMobile();
  }

  /**
   * Initializes the component by setting up observables for messages and answers
   * based on route parameters such as `conversationType` and `conversationId`.
   * It also initializes the `mobileDashboardState` to track the mobile dashboard's state.
   */
  ngOnInit() {
    // Initialize mobileDashboardState with the value from the MobileService
    this.mobileDashboardState = this.mobileService.mobileDashboardState;
    window.addEventListener('resize', this.updateMobile);

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
      switchMap(({ conversationType, conversationId }) =>
        this.conversationActiveRouterService.getMessages(
          conversationType!,
          conversationId!
        )
      ),
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

  /**
   * Logs out the current user by calling the `logout` method in the AuthService.
   */
  logout() {
    this.authService.logout();
  }

  /**
   * Ends editing the current post by resetting the `editingPostId` in the OverlayService.
   */
  endEditingPost() {
    this.overlayService.editingPostId.set(null);
  }
}
