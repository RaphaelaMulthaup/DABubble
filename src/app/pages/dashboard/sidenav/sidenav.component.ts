import { Component, WritableSignal } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { ChannelListComponent } from './channel-list/channel-list.component';
import { ContactsListComponent } from './contacts-list/contacts-list.component';
import { Observable, Subject, takeUntil } from 'rxjs';
import { UserInterface } from '../../../shared/models/user.interface';
import { DashboardState } from '../../../shared/types/dashboard-state.type';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../../services/search.service';
import { ScreenService } from '../../../services/screen.service';
import { ScreenSize } from '../../../shared/types/screen-size.type';
import { OverlayService } from '../../../services/overlay.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidenav',
  imports: [ContactsListComponent, ChannelListComponent, CommonModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  dashboardState: WritableSignal<DashboardState>;
  private destroy$ = new Subject<void>();
  screenSize$!: Observable<ScreenSize>;
  user$: Observable<UserInterface | null>;
  userDisplayName: string | null = null;

  constructor(
    private authService: AuthService,
    public overlayService: OverlayService,
    private router: Router,
    public searchService: SearchService,
    public screenService: ScreenService
  ) {
    this.dashboardState = this.screenService.dashboardState;
    this.screenSize$ = this.screenService.screenSize$;
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit() {
    this.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.userDisplayName = user?.name ?? null;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Method that is triggered when the user wants to open the "new message view" in the mobile dashboard.
   * It updates the mobile dashboard state to show the new message view.
   */
  openNewMessageView() {
    this.screenService.setDashboardState('new-message-view');
    this.router.navigate(['/dashboard', 'new-message']);
  }
}
