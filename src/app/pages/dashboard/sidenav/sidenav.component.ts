import { Component, inject, WritableSignal } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { ChannelListComponent } from './channel-list/channel-list.component';
import { ContactsListComponent } from './contacts-list/contacts-list.component';
import { Observable, Subject, takeUntil } from 'rxjs';
import { UserInterface } from '../../../shared/models/user.interface';
import { MobileService } from '../../../services/mobile.service';
import { MobileDashboardState } from '../../../shared/types/mobile-dashboard-state.type';

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
  isMobile = false;
  private updateMobile: () => void;
  mobileDashboardState: WritableSignal<MobileDashboardState>;

  constructor(
    private authService: AuthService,
    public mobileService: MobileService
  ) {
    this.mobileDashboardState = this.mobileService.mobileDashboardState;
    this.user$ = this.authService.currentUser$;
    this.updateMobile = () => {
      this.isMobile = this.mobileService.isMobile();
    };
  }

  /** Lifecycle hook that runs after component initialization */
  ngOnInit() {
    this.isMobile = this.mobileService.isMobile();
    window.addEventListener('resize', this.updateMobile);
    // Subscribe to the user observable to update the display name
    this.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.userDisplayName = user?.name ?? null;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openNewMessageView() {
    this.mobileService.setMobileDashboardState('new-message-view');
  }
}
