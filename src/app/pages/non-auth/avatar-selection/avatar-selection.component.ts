import { Component, EventEmitter, inject, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { AuthState } from '../../../shared/auth-state.type';

@Component({
  selector: 'app-avatar-selection',
  imports: [],
  templateUrl: './avatar-selection.component.html',
  styleUrl: './avatar-selection.component.scss'
})
export class AvatarSelectionComponent {
  authService = inject(AuthService);
  avatarOptions = [
    "avatar-option-1",
    "avatar-option-2",
    "avatar-option-3",
    "avatar-option-4",
    "avatar-option-5",
    "avatar-option-6",
  ]

  selectedAvatar: number = 0;

  @Output() changeAuthState = new EventEmitter<AuthState>();

  constructor() { }

  /**
  * This function emits the showLogin-variable to change the non-auth-components variable noAccount to false.
  */
  backToRegistration() {
    this.changeAuthState.emit('registration-form');
  }

  /**
  * This function displays the selected avatar-option and updates the userToRegister-data
  */
  selectAvatar(avatarOption: number) {
    this.selectedAvatar = avatarOption;
    this.authService.userToRegister.photoURL = this.avatarOptions[avatarOption-1];
  }
}
