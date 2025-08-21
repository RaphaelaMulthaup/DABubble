import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { AuthState } from '../../../shared/auth-state.type';

@Component({
  selector: 'app-avatar-selection',
  imports: [],
  templateUrl: './avatar-selection.component.html',
  styleUrl: './avatar-selection.component.scss'
})
export class AvatarSelectionComponent implements OnInit {
  authService = inject(AuthService);

  //an array with all the names of the available avatar-options
  avatarOptions = [
    "avatar-option-1",
    "avatar-option-2",
    "avatar-option-3",
    "avatar-option-4",
    "avatar-option-5",
    "avatar-option-6",
  ]

  //the number of the chosen avata-option or 0 for the no-avatar-image
  selectedAvatar: number = 0;

  @Output() changeAuthState = new EventEmitter<AuthState>();

  constructor() { }

  /**
  * This function checks the userToRegister in the authService for an already chosen option and selects it.
  */
  ngOnInit() {
    this.selectedAvatar = this.avatarOptions.indexOf(this.authService.userToRegister.photoURL) +1;
  }

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
