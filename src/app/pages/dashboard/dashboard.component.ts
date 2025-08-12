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
  imports: [UsersListComponent, CreateChannelFormComponent, ChannelListComponent, SidenavComponent, ChannelDetailComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  private authService = inject(AuthService);

    logout() {
    this.authService.logout();
  }
}
