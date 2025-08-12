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
  
  private authService = inject(AuthService);
  userDisplayName: string | null = null;
  user$ = this.authService.user$;
  ngOnInit() {
    this.user$.subscribe(user => {
      this.userDisplayName = user?.displayName ?? null;
    });
  }
}
