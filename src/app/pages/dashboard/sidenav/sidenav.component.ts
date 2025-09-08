import { Component, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { ChannelListComponent } from './channel-list/channel-list.component';
import { ContactsListComponent } from './contacts-list/contacts-list.component';
import { Observable, Subject, takeUntil } from 'rxjs';
import { UserInterface } from '../../../shared/models/user.interface';

@Component({
  selector: 'app-sidenav',
  imports: [ContactsListComponent, ChannelListComponent],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  /** Display name of the currently logged-in user */
  userDisplayName: string | null = null;

  /** Observable of the current user from AuthService */
  user$: Observable<UserInterface | null>;

  private destroy$ = new Subject<void>();

  constructor(private authService :AuthService){
    this.user$ = this.authService.currentUser$
  }

  /** Lifecycle hook that runs after component initialization */
  ngOnInit() {
    // Subscribe to the user observable to update the display name
    this.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.userDisplayName = user?.name ?? null;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
