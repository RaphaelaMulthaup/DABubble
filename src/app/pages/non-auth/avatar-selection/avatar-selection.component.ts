import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { AuthState } from '../../../shared/types/auth-state.type';
import { UserToRegisterInterface } from '../../../shared/models/user.to.register.interface';

@Component({
  selector: 'app-avatar-selection',
  imports: [],
  templateUrl: './avatar-selection.component.html',
  styleUrl: './avatar-selection.component.scss',
})
export class AvatarSelectionComponent implements OnInit {
  //an array with all the names of the available avatar-options
  avatarOptions = [
    './assets/img/avatar-option-1.svg',
    './assets/img/avatar-option-2.svg',
    './assets/img/avatar-option-3.svg',
    './assets/img/avatar-option-4.svg',
    './assets/img/avatar-option-5.svg',
    './assets/img/avatar-option-6.svg',
  ];
  //the number of the chosen avata-option or 0 for the no-avatar-image
  selectedAvatar: number = 0;
  showToast: boolean = false;
  @Input() userToRegister!: UserToRegisterInterface;
  @Output() changeAuthState = new EventEmitter<AuthState>();

  constructor(private authService: AuthService) {}

  /**
   * This function checks the userToRegister in the authService for an already chosen option and selects it.
   */
  ngOnInit() {
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
   * This function displays the selected avatar-option and updates the userToRegister-data
   */
  selectAvatar(avatarOption: number) {
    this.selectedAvatar = avatarOption;
    this.userToRegister.photoURL = this.avatarOptions[avatarOption - 1];
  }

  submitRegistration() {
    this.showToast = true;
    setTimeout(() => {
      this.authService.register(this.userToRegister).subscribe(() => {
        this.changeAuthState.emit('login');
      });
    }, 1000);
  }
}
