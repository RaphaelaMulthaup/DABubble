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

/**
 * The SidenavComponent is responsible for rendering the sidebar of the application,
 * which includes displaying the logged-in user's name, a list of channels, and contacts.
 * It also handles mobile-specific behavior, such as updating the mobile dashboard state.
 */
@Component({
  selector: 'app-sidenav', // The component selector used in HTML
  // Imports necessary child components used in the sidebar
  imports: [ContactsListComponent, ChannelListComponent, CommonModule],
  templateUrl: './sidenav.component.html', // HTML template for the sidebar
  styleUrl: './sidenav.component.scss', // Styles for the sidebar
})
export class SidenavComponent {
  /**
   * The display name of the currently logged-in user.
   * Initially set to null until the user data is fetched.
   */
  userDisplayName: string | null = null;

  /**
   * Observable that provides the current logged-in user from the AuthService.
   */
  user$: Observable<UserInterface | null>;

  /**
   * Subject used to manage unsubscriptions and cleanup when the component is destroyed.
   * It ensures that the component does not leave active subscriptions behind.
   */
  private destroy$ = new Subject<void>();

  screenSize$!: Observable<ScreenSize>;
  /**
   * The state of the mobile dashboard.
   * This signal stores the current state of the mobile dashboard (e.g., whether it's in 'new-message-view').
   */
  dashboardState: WritableSignal<DashboardState>;

  constructor(
    private authService: AuthService, // AuthService to manage user authentication
    public screenService: ScreenService,
    public searchService: SearchService,
    public overlayService: OverlayService,
    private router: Router
  ) {
    // Injecting the dashboardState from the mobile service to track mobile state
    this.dashboardState = this.screenService.dashboardState;

    // Fetching the current user observable from the AuthService
    this.user$ = this.authService.currentUser$;
    this.screenSize$ = this.screenService.screenSize$;
  }

  /**
   * Lifecycle hook that runs after the component is initialized.
   * Subscribes to the user observable to fetch and update the logged-in user's name.
   * Also sets up a resize event listener to handle changes in screen size for mobile behavior.
   */
  ngOnInit() {
    // Subscribe to the user observable to update the display name when user data changes
    this.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.userDisplayName = user?.name ?? null;
    });
  }

  /**
   * Lifecycle hook that runs when the component is destroyed.
   * It cleans up subscriptions by triggering the completion of the `destroy$` subject.
   */
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
    this.router.navigate(['/dashboard']);
  }
}
