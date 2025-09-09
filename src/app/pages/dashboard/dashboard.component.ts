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
import { ChatActiveRouterService } from '../../services/chat-active-router.service';
import { ActivatedRoute } from '@angular/router';
import { Observable, throwError, EMPTY } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { MobileDashboardState } from '../../shared/types/mobile-dashboard-state.type';
import { ChatService } from '../../services/chat.service';
import { MobileService } from '../../services/mobile.service';
import { PostInterface } from '../../shared/models/post.interface';

@Component({
  selector: 'app-dashboard',
  // Import child components used in the dashboard
  imports: [
    SidenavComponent,
    ConversationWindowComponent,
    CommonModule,
    HeaderDashboardComponent,
  ],
  templateUrl: './dashboard.component.html', // HTML template for the dashboard
  styleUrl: './dashboard.component.scss', // Styles for the dashboard
})
export class DashboardComponent {
  mobileDashboardState!: WritableSignal<MobileDashboardState>;
  messages$!: Observable<PostInterface[]>;
  answers$!: Observable<PostInterface[]>;

  constructor(
    public overlayService: OverlayService,
    private authService: AuthService,
    private chatActiveRouterService: ChatActiveRouterService,
    private route: ActivatedRoute,
    private mobileService: MobileService
  ) {}

  ngOnInit() {
    this.mobileDashboardState = this.mobileService.mobileDashboardState;
    
    this.messages$ = this.route.paramMap.pipe(
      map((params) => ({
        conversationType: params.get('conversationType'),
        conversationId: params.get('conversationId'),
      })),
      distinctUntilChanged(
        (a, b) =>
          a.conversationType === b.conversationType &&
          a.conversationId === b.conversationId
      ),
      filter(
        ({ conversationType, conversationId }) =>
          !!conversationType && !!conversationId
      ),
      switchMap(({ conversationType, conversationId }) =>
        this.chatActiveRouterService.getMessages(
          conversationType!,
          conversationId!
        )
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.answers$ = this.route.paramMap.pipe(
      map((params) => ({
        conversationType: params.get('conversationType'),
        conversationId: params.get('conversationId'),
        messageId: params.get('messageId'),
      })),
      distinctUntilChanged(
        (a, b) =>
          a.conversationType === b.conversationType &&
          a.conversationId === b.conversationId &&
          a.messageId === b.messageId
      ),
      filter(
        ({ conversationType, conversationId, messageId }) =>
          !!conversationType && !!conversationId && !!messageId
      ),
      switchMap(({ conversationType, conversationId, messageId }) =>
        this.chatActiveRouterService.getAnswers(
          conversationType!,
          conversationId!,
          messageId!
        )
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Logs out the current user
   */
  logout() {
    this.authService.logout();
  }

  endEditingPost() {
    this.overlayService.editingPostId.set(null);
  }
}