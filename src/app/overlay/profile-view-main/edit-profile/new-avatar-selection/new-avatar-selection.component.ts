import { Component, Output } from '@angular/core';
import { OverlayService } from '../../../../services/overlay.service';
import { AuthService } from '../../../../services/auth.service';
import { Observable } from 'rxjs';
import { UserInterface } from '../../../../shared/models/user.interface';
import { AsyncPipe, CommonModule } from '@angular/common';
import { HeaderOverlayComponent } from '../../../../shared/components/header-overlay/header-overlay.component';
import { OverlayRef } from '@angular/cdk/overlay';
import { AVATAROPTIONS } from '../../../../shared/constants/avatar-options';

@Component({
  selector: 'app-new-avatar-selection',
  imports: [AsyncPipe, CommonModule, HeaderOverlayComponent],
  templateUrl: './new-avatar-selection.component.html',
  styleUrl: './new-avatar-selection.component.scss',
})
export class NewAvatarSelectionComponent {
  @Output() overlayRef!: OverlayRef;
  user$: Observable<UserInterface | null>;
  avatarOptions = AVATAROPTIONS;
  selectedAvatar: number = 0;

  constructor(
    private authService: AuthService,
    public overlayService: OverlayService
  ) {
    this.user$ = this.authService.currentUser$;
  }

  /**
   * Sets the selectedAvatar to the chosen avatar.
   * 
   * @param avatarOption - the chosen avatar-index
   */
  selectAvatar(avatarOption: number) {
    this.selectedAvatar = avatarOption;
  }

  /**
   * Updates the users avatar.
   */
  changeAvatar() {
    if (this.selectedAvatar > 0) {
      const avatarUrl = this.avatarOptions[this.selectedAvatar - 1];
      this.authService.updateUserPhotoUrl(avatarUrl).then(() => {
        this.overlayService.closeOne(this.overlayRef);
      });
    } else { this.overlayService.closeOne(this.overlayRef); }
  }
}
