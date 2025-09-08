import { Component, inject, OnInit } from '@angular/core';
import { OverlayService } from '../../services/overlay.service';
import { Observable } from 'rxjs';
import { UserInterface } from '../../shared/models/user.interface';
import { AuthService } from '../../services/auth.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { HeaderOverlayComponent } from '../../shared/components/header-overlay/header-overlay.component';

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

  constructor(
    public overlayService: OverlayService,
    private authService: AuthService
  ) {
    this.user$ = this.authService.currentUser$;
  }

  showEdit() {
    this.overlayService.openComponent(
      EditProfileComponent,
      'cdk-overlay-dark-backdrop',
      { globalPosition: 'center' }
    );
  }
}
