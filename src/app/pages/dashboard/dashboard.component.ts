import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { SidenavComponent } from './sidenav/sidenav.component';
import { ConversationWindowComponent } from './conversation-window/conversation-window.component';
import { OverlayComponent } from '../../overlay/overlay.component';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../services/overlay.service';
import { map, switchMap, tap } from 'rxjs/operators';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ChatActiveRouterService } from '../../services/chat-active-router.service';
import { ActivatedRoute } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { MobileDashboardState } from '../../shared/mobile-dashboard-state.type';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-dashboard',
  // Import child components used in the dashboard
  imports: [
    SidenavComponent,
    ConversationWindowComponent,
    OverlayComponent,
    CommonModule,
    HeaderComponent
  ],
  templateUrl: './dashboard.component.html', // HTML template for the dashboard
  styleUrl: './dashboard.component.scss', // Styles for the dashboard
})
export class DashboardComponent {
  // Inject OverlayService to handle the overlays
  public overlayService = inject(OverlayService);

  // Inject the authentication service to manage user login/logout
  private authService = inject(AuthService);
  // private chatService = inject(ChatService);
  private chatActiveRouterService = inject(ChatActiveRouterService);
  private route = inject(ActivatedRoute);

  currentState: MobileDashboardState = 'message-window';

  messages$ = this.route.paramMap.pipe(
    switchMap((params) =>
      this.chatActiveRouterService.getMessages(params.get('type')!, params.get('id')!)
    )
  );

  answers$ = this.route.paramMap.pipe(
    switchMap((params) =>
      this.chatActiveRouterService.getAnswers(
        params.get('type')!,
        params.get('id')!,
        params.get('messageId')!
      )
    )
  );

  msgId$ = this.route.paramMap.pipe(map((params) => params.get('messageId')));

  /**
   * Logs out the current user
   */
  logout() {
    this.authService.logout();
  }
}