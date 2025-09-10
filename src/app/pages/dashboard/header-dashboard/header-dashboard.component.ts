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

@Component({
  selector: 'app-header-dashboard',
  imports: [
    AsyncPipe,
    SearchBarComponent,
    ProfileViewMainComponent,
    CommonModule,
  ],
  templateUrl: './header-dashboard.component.html',
  styleUrl: './header-dashboard.component.scss',
})
export class HeaderDashboardComponent {
  currentUser$?: Observable<UserInterface | null>;
  mobileDashboardState: WritableSignal<MobileDashboardState>;
  isMobile = false;
  private updateMobile: () => void;

  constructor(
    private overlayService: OverlayService,
    public authService: AuthService,
    public mobileService: MobileService
  ) {
    this.mobileDashboardState = this.mobileService.mobileDashboardState;
    this.currentUser$ = this.authService.currentUser$;
    this.updateMobile = () => {
      this.isMobile = this.mobileService.isMobile();
    };
  }

  ngOnInit() {
    this.isMobile = this.mobileService.isMobile();
    window.addEventListener('resize', this.updateMobile);
  }

  showProfile() {
    this.overlayService.openComponent(
      ProfileViewMainComponent,
      'cdk-overlay-dark-backdrop',
      { globalPosition: 'center' }
    );
  }
}
