import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  WritableSignal,
} from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { UserInterface } from '../../../shared/models/user.interface';
import { AsyncPipe, CommonModule } from '@angular/common';
import { MobileDashboardState } from '../../../shared/types/mobile-dashboard-state.type';
import { SearchBarComponent } from './search-bar/search-bar.component';
import { MobileService } from '../../../services/mobile.service';
import { ProfileViewMainComponent } from '../../../overlay/profile-view-main/profile-view-main.component';
import { OverlayService } from '../../../services/overlay.service';
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
  mobileDashboardState: WritableSignal<MobileDashboardState>;

  // Flag indicating whether the device is mobile or not.
  isMobile = false;

  // Method to update the mobile state based on window resizing.
  private updateMobile: () => void;

  constructor(
    private overlayService: OverlayService, // Inject the OverlayService to handle overlay actions.
    public authService: AuthService, // Inject the AuthService to manage authentication-related data.
    public mobileService: MobileService // Inject the MobileService to determine mobile state.
  ) {
    // Initialize the mobile dashboard state.
    this.mobileDashboardState = this.mobileService.mobileDashboardState;

    // Initialize the current user observable from AuthService.
    this.currentUser$ = this.authService.currentUser$;

    // Update method to check the mobile state.
    this.updateMobile = () => {
      this.isMobile = this.mobileService.isMobile();
    };
  }

  /**
   * ngOnInit lifecycle hook, called after component initialization.
   * It sets the initial state for mobile view and adds an event listener for resizing.
   */
  ngOnInit() {
    // Set initial value for isMobile.
    this.isMobile = this.mobileService.isMobile();

    // Add an event listener for window resizing to update mobile state dynamically.
    window.addEventListener('resize', this.updateMobile);
  }

  /**
   * Opens a profile overlay using the OverlayService when the profile is clicked.
   */
  showSettings() {
    this.overlayService.openComponent(
      SettingsComponent, // The component to be displayed in the overlay.
      'cdk-overlay-dark-backdrop', // Backdrop style for the overlay.
      { globalPosition: 'center' } // Position of the overlay (centered globally).
    );
  }
}
