import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { UserInterface } from '../../shared/models/user.interface';
import { OverlayService } from '../../services/overlay.service';
import { AuthService } from '../../services/auth.service';
import { ProfileViewMainComponent } from '../profile-view-main/profile-view-main.component';
import { OverlayRef } from '@angular/cdk/overlay';
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
  isClosing = false;

  constructor(
    public authService: AuthService,
    public overlayService: OverlayService,
    public screenService: ScreenService
  ) {
    this.user$ = this.authService.currentUser$;
    this.screenSize$ = this.screenService.screenSize$;
  }

  /**
   * This function opens the ProfileViewMain-Overlay.
   */
  openProfileViewMainOverlay() {
    this.overlayService.closeAll();
    const overlay = this.overlayService.openComponent(
      ProfileViewMainComponent,
      'cdk-overlay-dark-backdrop',
      { globalPosition: 'center' }
    );
    overlay!.ref.instance.overlayRef = overlay?.overlayRef as OverlayRef;
  }

  /**
   * This function closes the ProfileViewMain-Overlay after the animation.
   */
  closeOverlay() {
    this.isClosing = true;
    setTimeout(() => {
      this.overlayService.closeAll();
    }, 500);
  }
}
