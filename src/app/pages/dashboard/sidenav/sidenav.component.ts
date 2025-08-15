import { Component, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { UsersListComponent } from '../users-list/users-list.component';
import { ChannelListComponent } from '../channel-list/channel-list.component';

@Component({
  selector: 'app-sidenav',
  imports: [UsersListComponent, ChannelListComponent],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent {
  
  /** AuthService instance for authentication-related operations */
  private authService = inject(AuthService);

  /** Display name of the currently logged-in user */
  userDisplayName: string | null = null;

  /** Observable of the current user from AuthService */
  user$ = this.authService.user$;

  /** Lifecycle hook that runs after component initialization */
  ngOnInit() {
    // Subscribe to the user observable to update the display name
    this.user$.subscribe(user => {
      this.userDisplayName = user?.displayName ?? null;
    });
  }
}
