import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  Validators,
} from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { CommonModule } from '@angular/common';
import { AuthState } from '../../../shared/types/auth-state.type';

@Component({
  selector: 'app-confirm-password',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './confirm-password.component.html',
  styleUrl: './confirm-password.component.scss',
})
export class ConfirmPasswordComponent {
  @Input() oobCode!: string;
  @Output() changeAuthState = new EventEmitter<AuthState>();

  confirmForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });
  userList!: any[];
  functions: any;
  userColl: any;

  emailList: string[] = [];
  showErrorMessage: boolean = false;
  showToast: boolean = false;
  emailExists: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  /**
   * Compares email from input with emails from loaded mail list.
   * Throws error message if no matching mail
   */
  async onSubmit() {
    const inputEmail = this.confirmForm.get('email')?.value;
    if (await this.userService.getUserIdByEmail(inputEmail)) {
      this.authService
        .sendPasswordResetEmail(inputEmail)
        .then(() => {
          this.showToast = true;
          setTimeout(() => this.backToLogin(), 1500);
        })
        .catch((error) => {
          console.error('Reset-Mail konnte nicht versendet werden', error);
          this.showErrorMessage = true;
        });
    } else this.showErrorMessage = true;
  }

  /**
   * This function emits the showLogin-variable to change the non-auth-components variable noAccount to false.
   */
  backToLogin() {
    this.changeAuthState.emit('login');
  }

  /**
   * Sends linkt to reset password to email
   */
  sendPasswortResset(email: string) {
    this.authService
      .sendPasswordResetEmail(email)
      .then(() => {
        this.showToast = true;
      })
      .catch((error) => {
        console.error('Fehler beim senden der Reset-Mail', error);
      });
  }
}
