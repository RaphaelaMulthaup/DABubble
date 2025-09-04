import { Component, inject, OnInit } from '@angular/core';
import { OverlayService } from '../../services/overlay.service';
import { Observable } from 'rxjs';
import { UserInterface } from '../../shared/models/user.interface';
import { AuthService } from '../../services/auth.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { HeaderOverlayComponent } from "../../shared/components/header-overlay/header-overlay.component";

@Component({
  selector: 'app-profile-view-main',
  imports: [AsyncPipe, CommonModule, EditProfileComponent, HeaderOverlayComponent],
  templateUrl: './profile-view-main.component.html',
  styleUrl: './profile-view-main.component.scss',
})
export class ProfileViewMainComponent implements OnInit {
  public overlayService = inject(OverlayService);
  private authService = inject(AuthService);

  user$: Observable<UserInterface | null>;

  constructor() {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit(): void {}

  showEdit() {
    this.overlayService.openComponent(
      EditProfileComponent,
      'cdk-overlay-dark-backdrop',
      { globalPosition: 'center' }
    );
  }
}
