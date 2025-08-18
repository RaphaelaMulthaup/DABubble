import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { SidenavComponent } from './sidenav/sidenav.component';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-dashboard',
  // Import child components used in the dashboard
  imports: [SidenavComponent, ChatWindowComponent, HeaderComponent],
  templateUrl: './dashboard.component.html', // HTML template for the dashboard
  styleUrl: './dashboard.component.scss', // Styles for the dashboard
})
export class DashboardComponent {
  // Inject the authentication service to manage user login/logout
  private authService = inject(AuthService);

  /**
   * Logs out the current user
   */
  logout() {
    this.authService.logout();
  }
}
