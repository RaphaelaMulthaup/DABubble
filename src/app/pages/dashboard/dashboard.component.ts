import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { UsersListComponent } from "./users-list/users-list.component";
import { CreateChannelFormComponent } from "../../shared/forms/create-channel-form/create-channel-form.component";
import { ChannelListComponent } from "./channel-list/channel-list.component";
import { SidenavComponent } from "./sidenav/sidenav.component";
import { ChannelDetailComponent } from "./channel-detail/channel-detail.component";


@Component({
  selector: 'app-dashboard',
  // Import child components used in the dashboard
  imports: [UsersListComponent, CreateChannelFormComponent, ChannelListComponent, SidenavComponent, ChannelDetailComponent],
  templateUrl: './dashboard.component.html', // HTML template for the dashboard
  styleUrl: './dashboard.component.scss' // Styles for the dashboard
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
