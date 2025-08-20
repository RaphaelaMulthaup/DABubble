import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { SidenavComponent } from './sidenav/sidenav.component';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import { OverlayComponent } from '../../overlay/overlay.component';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../services/overlay.service';


@Component({
  selector: 'app-dashboard',
  // Import child components used in the dashboard
  imports: [SidenavComponent, ChatWindowComponent, OverlayComponent, CommonModule],
  templateUrl: './dashboard.component.html', // HTML template for the dashboard
  styleUrl: './dashboard.component.scss' // Styles for the dashboard
})
export class DashboardComponent {
  // Inject OverlayService to handle the overlays
  public overlayService = inject(OverlayService);

  // Inject the authentication service to manage user login/logout
  private authService = inject(AuthService);

  /**
   * Logs out the current user
   */
  logout() {
    this.authService.logout();
  }
}
