import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { AuthState } from '../../../shared/types/auth-state.type';
import { UserToRegisterInterface } from '../../../shared/models/user.to.register.interface';
import { AVATAROPTIONS } from '../../../shared/constants/avatar-options';

@Component({
  selector: 'app-avatar-selection',
  imports: [],
  templateUrl: './avatar-selection.component.html',
  styleUrl: './avatar-selection.component.scss',
})
export class AvatarSelectionComponent implements OnInit {
  @Input() userToRegister!: UserToRegisterInterface;
  @Output() changeAuthState = new EventEmitter<AuthState>();
  avatarOptions = AVATAROPTIONS;  //an array with all the names of the available avatar-options
  selectedAvatar: number = 0;     //the number of the chosen avata-option or 0 for the no-avatar-image
  showToast: boolean = false;

  constructor(public authService: AuthService) {}

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
