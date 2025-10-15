import { Component, WritableSignal } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { UserInterface } from '../../../shared/models/user.interface';
import { AsyncPipe, CommonModule } from '@angular/common';
import { DashboardState } from '../../../shared/types/dashboard-state.type';
import { SearchBarComponent } from './search-bar/search-bar.component';
import { ProfileViewMainComponent } from '../../../overlay/profile-view-main/profile-view-main.component';
import { OverlayService } from '../../../services/overlay.service';
import { ScreenSize } from '../../../shared/types/screen-size.type';
import { ScreenService } from '../../../services/screen.service';
import { SettingsComponent } from '../../../overlay/settings/settings.component';

@Component({
  selector: 'app-header-dashboard',
  imports: [
    AsyncPipe,
    SearchBarComponent,
    ProfileViewMainComponent,
    SettingsComponent,
    CommonModule,
  ],
  templateUrl: './header-dashboard.component.html',
  styleUrl: './header-dashboard.component.scss',
})
export class HeaderDashboardComponent {
  // Observable that holds the current user object, or null if not authenticated.
  currentUser$?: Observable<UserInterface | null>;

  // A writable signal to track the mobile dashboard state.
  dashboardState: WritableSignal<DashboardState>;

  screenSize$!: Observable<ScreenSize>;

  constructor(
    public screenService: ScreenService,
    private overlayService: OverlayService, // Inject the OverlayService to handle overlay actions.
    public authService: AuthService // Inject the AuthService to manage authentication-related data.
  ) {
    // Initialize the mobile dashboard state.
    this.dashboardState = this.screenService.dashboardState;

    // Initialize the current user observable from AuthService.
    this.currentUser$ = this.authService.currentUser$;

    this.screenSize$ = this.screenService.screenSize$;
  }

  /**
   * Opens a profile overlay using the OverlayService when the profile is clicked.
   */
  openSettings(event: MouseEvent) {
    this.overlayService.openComponent(
      SettingsComponent,
      'cdk-overlay-dark-backdrop',
      {
        origin: event.currentTarget as HTMLElement,
        originPosition: {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
        }
      }
    );
  }
}
