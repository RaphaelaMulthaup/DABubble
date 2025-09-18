import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { UserInterface } from '../../shared/models/user.interface';
import { OverlayService } from '../../services/overlay.service';
import { AuthService } from '../../services/auth.service';
import { ProfileViewMainComponent } from '../profile-view-main/profile-view-main.component';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';

@Component({
  selector: 'app-settings',
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
 user$: Observable<UserInterface | null>;

  constructor(
    public overlayService: OverlayService,
    private authService: AuthService
  ) {
    this.user$ = this.authService.currentUser$;
  }

  showProfile() {
    const overlay = this.overlayService.openComponent(
      ProfileViewMainComponent,
      'cdk-overlay-dark-backdrop',
      { globalPosition: 'center' }
    );

    overlay!.ref.instance.overlayRef = overlay?.overlayRef as OverlayRef
  }

  logOut() {
    this.authService.logout();
  }

}
