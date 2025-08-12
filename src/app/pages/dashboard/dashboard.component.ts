import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { UsersListComponent } from "./users-list/users-list.component";
import { CreateChannelFormComponent } from "../../shared/forms/create-channel-form/create-channel-form.component";
import { ChannelListComponent } from "./channel-list/channel-list.component";


@Component({
  selector: 'app-dashboard',
  imports: [UsersListComponent, CreateChannelFormComponent, ChannelListComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  userDisplayName: string | null = null;

  ngOnInit() {
    this.user$.subscribe(user => {
      this.userDisplayName = user?.displayName ?? null;
    });
  }
  private authService = inject(AuthService);
  user$ = this.authService.user$;

    logout() {
    this.authService.logout();
  }
}
