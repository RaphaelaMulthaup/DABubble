import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { AuthState } from '../../../shared/types/auth-state.type';
import { UserToRegisterInterface } from '../../../shared/models/user.to.register.interface';
import { AVATAROPTIONS } from '../../../shared/constants/avatar-options';
import { ScreenService } from '../../../services/screen.service';

@Component({
  selector: 'app-avatar-selection',
  imports: [],
  templateUrl: './avatar-selection.component.html',
  styleUrl: './avatar-selection.component.scss',
})
export class AvatarSelectionComponent implements OnInit {
  @Input() userToRegister!: UserToRegisterInterface;
  @Output() changeAuthState = new EventEmitter<AuthState>();
  
  avatarOptions = AVATAROPTIONS;
  selectedAvatar: number = 0;
  showToast: boolean = false;

  constructor(public authService: AuthService, private screenService: ScreenService) {}

  ngOnInit() {
    this.setPreselectedAvatar();
  }

  /**
   * This function checks the userToRegister in the authService for an already chosen option and selects it.
   */
  setPreselectedAvatar() {
    this.selectedAvatar =
      this.avatarOptions.indexOf(this.userToRegister.photoURL) + 1;
  }

  /**
   * This function emits the showLogin-variable to change the non-auth-components variable noAccount to false.
   */
  backToRegistration() {
    this.changeAuthState.emit('registration-form');
  }

  /**
   * This function is used to display the selected avatar-option and updates the userToRegister-data.
   *
   * @param avatarOption - the index of the chosen avatar
   */
  selectAvatar(avatarOption: number) {
    this.selectedAvatar = avatarOption;
    this.userToRegister.photoURL = this.avatarOptions[avatarOption - 1];
  }

  /**
   * This function registers the user, shows an according toast-notification and changes the auth-state.
   */
  submitRegistration() {
    this.showToast = true;
    setTimeout(() => {
      this.authService.register(this.userToRegister).subscribe(() => {
        this.changeAuthState.emit('login');
        this.screenService.setInitDashboardState();
      });
    }, 1000);
  }
}
