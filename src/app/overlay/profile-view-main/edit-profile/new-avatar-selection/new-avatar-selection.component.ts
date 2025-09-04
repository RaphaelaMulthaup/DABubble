import { Component, inject } from '@angular/core';
import { OverlayService } from '../../../../services/overlay.service';
import { AuthService } from '../../../../services/auth.service';
import { Observable } from 'rxjs';
import { UserInterface } from '../../../../shared/models/user.interface';
import { AsyncPipe, CommonModule } from '@angular/common';
import { HeaderOverlayComponent } from "../../../../shared/components/header-overlay/header-overlay.component";
import { EditProfileComponent } from '../edit-profile.component';

@Component({
  selector: 'app-new-avatar-selection',
  imports: [
    AsyncPipe,
    CommonModule,
    HeaderOverlayComponent
],
  templateUrl: './new-avatar-selection.component.html',
  styleUrl: './new-avatar-selection.component.scss'
})
export class NewAvatarSelectionComponent {
  public overlayService = inject(OverlayService);
  private authService = inject(AuthService);

  user$: Observable<UserInterface | null>

  selectedAvatar: number = 0;

    //an array with all the names of the available avatar-options
  avatarOptions = [
    "./assets/img/avatar-option-1.svg",
    "./assets/img/avatar-option-2.svg",
    "./assets/img/avatar-option-3.svg",
    "./assets/img/avatar-option-4.svg",
    "./assets/img/avatar-option-5.svg",
    "./assets/img/avatar-option-6.svg",
  ]

  constructor() {
    this.user$ = this.authService.currentUser$;
  }

  /**
   * 
   * function to select new user avatar
   *  
   */
  selectAvatar(avatarIdx: number): void {
    this.selectedAvatar = avatarIdx;
    this.authService.userToRegister.photoURL = this.avatarOptions[avatarIdx - 1];
  }

  /**
   * 
   * funstion saves selected avatar an close overlay
   * 
   */
  saveAvatar() {
    if (this.selectedAvatar > 0) {
      const avatarUrl = this.avatarOptions[this.selectedAvatar - 1];
      this.authService.updateUserPhotoUrl(avatarUrl).then(() => {
        this.overlayService.close();
        this.backToEdit();
      }) 
    } else {
      this.overlayService.close();
    }
  }

  backToEdit() {
    this.overlayService.openComponent(
      EditProfileComponent,
      'cdk-overlay-dark-backdrop',
      { globalPosition: 'center' }
    );
  }
}
