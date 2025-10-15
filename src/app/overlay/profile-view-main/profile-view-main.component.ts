import { Component } from '@angular/core';
import { OverlayService } from '../../services/overlay.service';
import { Observable } from 'rxjs';
import { UserInterface } from '../../shared/models/user.interface';
import { AuthService } from '../../services/auth.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { HeaderOverlayComponent } from '../../shared/components/header-overlay/header-overlay.component';
import { OverlayRef } from '@angular/cdk/overlay';

@Component({
  selector: 'app-profile-view-main',
  imports: [
    AsyncPipe,
    CommonModule,
    EditProfileComponent,
    HeaderOverlayComponent,
  ],
  templateUrl: './profile-view-main.component.html',
  styleUrl: './profile-view-main.component.scss',
})
export class ProfileViewMainComponent {
  user$: Observable<UserInterface | null>;
  overlayRef!: OverlayRef;

  constructor(
    private authService: AuthService,
    public overlayService: OverlayService
  ) {
    this.user$ = this.authService.currentUser$;
  }

  /**
   * This function opens the EditProfile-Overlay.
   */
  openEditProfileOverlay() {
    const overlay = this.overlayService.openComponent(
      EditProfileComponent,
      'cdk-overlay-dark-backdrop',
      { globalPosition: 'center' }
    );
    overlay!.ref.instance.overlayRef = overlay?.overlayRef as OverlayRef;
  }
}
