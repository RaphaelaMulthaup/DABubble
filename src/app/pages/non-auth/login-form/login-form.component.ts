import { Component, inject, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthState } from '../../../shared/types/auth-state.type';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-form',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
})
export class LoginFormComponent {
  @Output() forgotPassword = new EventEmitter<void>();
  showLogin: boolean = true;

  // turns true, if loginWithGoogle() is executed and therefor disabling the error-message;
  isSubmittingWithGoogle: boolean = false;

  // Stores error messages during login
  showErrorMessage: boolean = false;

  // Form group for login with email and password fields
  loginForm: FormGroup = new FormGroup({
    // Email input with required and email validators
    email: new FormControl('', [Validators.required, Validators.email]),

    // Password input with required and minimum length validators
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  constructor(private authService: AuthService) {}

  onForgotPassword() {
    this.showLogin = false;
    this.forgotPassword.emit();
  }

  a(event: KeyboardEvent): boolean {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  /**
   * Handles form submission
   * Retrieves email and password from the form and attempts login
   * Displays an error message if login fails
   */
  onSubmit(): void {
    const email = this.loginForm.get('email')?.value;
    const password = this.loginForm.get('password')?.value;
    this.authService.login(email, password).subscribe({
      next: () => {
        console.log('Login successful');
      },
      error: () => {
        // Sets the errorMessage to the returned error code
        this.showErrorMessage = true;
      },
    });
  }

  /**
   * Login using Google OAuth via AuthService
   */
  loginWithGoogle() {
    this.isSubmittingWithGoogle = true;
    this.authService.loginWithGoogle().subscribe({
      next: () => {
        console.log('Login with Google successful');
      },
      error: (err) => {
        console.error('Login with Google failed', err);
        this.isSubmittingWithGoogle = false;
      },
    });
  }
}
