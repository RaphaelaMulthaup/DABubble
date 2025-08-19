import { Component, EventEmitter, inject, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FormControl, FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthState } from '../../../shared/auth-state.type';

@Component({
  selector: 'app-register-form',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.scss'
})
export class RegisterFormComponent {
  // whether the privacy-policy is accepted or not
  checkboxChecked = false;
  // Injects the authentication service
  authService = inject(AuthService);

  // Defines the registration form with validators for email, password, and display name
  registerForm: FormGroup = new FormGroup({
    displayName: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    privacyPolicy: new FormControl(false, [Validators.required])
  });

  @Output() changeAuthState = new EventEmitter<AuthState>();

  constructor() {
    // Constructor remains empty
  }

  /**
   * This function emits the showLogin-variable to change the non-auth-components variable noAccount to false.
   */
  backToLogin() {
    this.changeAuthState.emit('login');
  }

  /**
   * This function toggles the checkboxChecked-variable to change the checkbox' appearence.
   */
  toggleCheckboxChecked() {
    this.checkboxChecked = !this.checkboxChecked;
  }

  // Handles form submission
  onSubmit(): void {
    const thisForm = this.registerForm.value;

    // // Call the authentication service to register the user
    // this.authService.register(thisForm.email, thisForm.displayName, thisForm.password).subscribe({
    //   next: () => {
    //     console.log('Registration successful');
    //   },
    // });

    this.authService.userToRegister.displayName = thisForm.displayName;
    this.authService.userToRegister.email = thisForm.email;
    this.authService.userToRegister.password = thisForm.password;
    // console.log(this.authService.userToRegister)
    this.changeAuthState.emit('registration-avatar');
  }
}
