import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { UserInterface } from '../../shared/models/user.interface';
import { OverlayService } from '../../services/overlay.service';
import { AuthService } from '../../services/auth.service';
import { ProfileViewMainComponent } from '../profile-view-main/profile-view-main.component';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ScreenSize } from '../../shared/types/screen-size.type';
import { ScreenService } from '../../services/screen.service';
import { RectangleDragCloseDirective } from '../../shared/directives/rectangle-drag-close.directive';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, RectangleDragCloseDirective],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  user$: Observable<UserInterface | null>;
  screenSize$!: Observable<ScreenSize>;

  //We use this boolean to check if our overlay is open or close
  isClosing = false;

  constructor(
    public overlayService: OverlayService,
    private authService: AuthService,
    public screenService: ScreenService
  ) {
    this.user$ = this.authService.currentUser$;
    this.screenSize$ = this.screenService.screenSize$;
  }

  showProfile() {
    const overlay = this.overlayService.openComponent(
      ProfileViewMainComponent,
      'cdk-overlay-dark-backdrop',
      { globalPosition: 'center' }
    );

    overlay!.ref.instance.overlayRef = overlay?.overlayRef as OverlayRef;
  }

  logOut() {
    this.authService.logout();
  }

  closeOverlay() {
    this.isClosing = true;
    setTimeout(() => {
      this.overlayService.closeAll();
    }, 500); // duration matches CSS transition
  }
}
