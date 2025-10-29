import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, finalize, Observable, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-login-form',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
})
export class LoginFormComponent implements OnInit, OnDestroy {
  @Output() forgotPassword = new EventEmitter<void>();
  destroy$ = new Subject<void>();
  loginForm: FormGroup;  
  showLogin: boolean = true;
  isSubmittingWithGoogleOrAsGuest: boolean = false;
  showEmailError :boolean = false;
  showPasswordError :boolean = false;
  showLoginErrorMessage: boolean = false;
                             
  constructor(private authService: AuthService) {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
      ]),
    });
  }

  ngOnInit() {
    this.setupErrorHandler('password', 'showPasswordError');
    this.setupErrorHandler('email', 'showEmailError');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Sets up a reactive error handler for a specific form control.
   * The handler updates a boolean property after a short debounce when the control becomes invalid and touched, and the user is not submitting via Google or as a guest.
   *
   * @param controlName - The name of the form control to observe (e.g. 'email', 'password')
   * @param target - The component property name that indicates whether the error message should be shown
   */
  setupErrorHandler(controlName: string, target: 'showEmailError' | 'showPasswordError') {
    const control = this.loginForm.get(controlName);
    control?.statusChanges.pipe(
      debounceTime(200),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this[target] =
        !!control &&
        control.invalid &&
        control.touched &&
        !this.isSubmittingWithGoogleOrAsGuest;
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
    this.handleLogin(this.authService.login(email, password), true);
  }

  /**
   * This function handles the login for users that use their Google account.
   */
  loginWithGoogle() {
    this.isSubmittingWithGoogleOrAsGuest = true;
    this.handleLogin(this.authService.loginWithGoogle(), false);
  }

  /**
   * This function handles the login for guests.
   */
  loginGuest() {
    this.isSubmittingWithGoogleOrAsGuest = true;
    this.handleLogin(this.authService.loginAsGuest(), false);
  }

  /**
   * This function handles the login for users and guests.
   * When an error occurs in the login-process, the error-message is shown.
   * When the login-process finished (success or error), the isSubmittingWithGoogleOrAsGuest is set back to false.
   *
   * @param login$ - The login-operation as an observable
   * @param showErrorOnFail - whether an error-message should be shown for invalid inputs or not
   */
  handleLogin(login$: Observable<any>, showErrorOnFail:boolean = true) {
    login$
      .pipe(finalize(() => (this.isSubmittingWithGoogleOrAsGuest = false)))
      .subscribe({
        error: () => {if(showErrorOnFail) setTimeout(() => this.showLoginErrorMessage = true, 200)}
      });
  }
}
