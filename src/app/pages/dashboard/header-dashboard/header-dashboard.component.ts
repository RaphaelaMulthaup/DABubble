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
import { UserService } from '../../../services/user.service';

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
  dashboardState: WritableSignal<DashboardState>;
  currentUser$?: Observable<UserInterface | null>;
  screenSize$!: Observable<ScreenSize>;

  constructor(
    public authService: AuthService,
    private overlayService: OverlayService,
    public screenService: ScreenService,
    public userService: UserService,
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.dashboardState = this.screenService.dashboardState;
    this.screenSize$ = this.screenService.screenSize$;
  }

  /**
   * This function opens the Settings-Overlay.
   *
   * @param event - The user-interaction with an object.
   */
  openSettingsOverlay(event: MouseEvent) {
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
        },
      }
    );
  }
}
