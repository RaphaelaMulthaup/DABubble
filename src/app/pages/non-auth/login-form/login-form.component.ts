import { Component, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize, Observable } from 'rxjs';

@Component({
  selector: 'app-login-form',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
})
export class LoginFormComponent {
  @Output() forgotPassword = new EventEmitter<void>();

  showLogin: boolean = true;
  isSubmittingWithGoogleOrAsGuest: boolean = false;
  showErrorMessage: boolean = false;
  loginForm: FormGroup;                             
  
  constructor(private authService: AuthService) {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
      ]),
    });
  }

  /**
   * This function navigates the user to the area, where they can set a new password.
   */
  onForgotPassword() {
    this.showLogin = false;
    this.forgotPassword.emit();
  }

  /**
   * This function handles the login for users that use their DA-Bubble account.
   */
  onSubmit() {
    if (this.loginForm.invalid) return;
    const { email, password } = this.loginForm.value as {
      email: string;
      password: string;
    };
    this.handleLogin(this.authService.login(email, password));
  }

  /**
   * This function handles the login for users that use their Google account.
   */
  loginWithGoogle() {
    this.isSubmittingWithGoogleOrAsGuest = true;
    this.handleLogin(this.authService.loginWithGoogle());
  }

  /**
   * This function handles the login for guests.
   */
  loginGuest() {
    this.isSubmittingWithGoogleOrAsGuest = true;
    this.handleLogin(this.authService.loginAsGuest());
  }

  /**
   * This function handles the login for users and guests.
   * When an error occurs in the login-process, the error-message is shown.
   * When the login-process finished (success or error), the isSubmittingWithGoogleOrAsGuest is set back to false.
   *
   * @param login$ - the login-operation as an observable
   */
  handleLogin(login$: Observable<any>) {
    login$
      .pipe(finalize(() => (this.isSubmittingWithGoogleOrAsGuest = false)))
      .subscribe({
        error: () => {
          this.showErrorMessage = true;
        },
      });
  }
}
