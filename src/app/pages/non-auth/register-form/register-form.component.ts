import { Component, EventEmitter, inject, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FormControl, FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-register-form',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.scss'
})
export class RegisterFormComponent {
  checkboxChecked = false;
  // Injects the authentication service
  authService = inject(AuthService);

  // // Holds any error messages during registration
  // errorMessage: string | null = null;

  // Defines the registration form with validators for email, password, and display name
  registerForm: FormGroup = new FormGroup({
    displayName: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    privacyPolicy: new FormControl(false, [Validators.required])
  });

  @Output() showLogin = new EventEmitter<boolean>();

  constructor() {
    // Constructor remains empty
  }

  /**
   * This function toggles the checkboxChecked-variable to change the checkbox' appearence.
   */
  toggleCheckboxChecked() {
    this.checkboxChecked = !this.checkboxChecked;
  }

  // Handles form submission
  onSubmit(): void {
    // Get raw form values
    const thisForm = this.registerForm.value;
    console.log(thisForm);

    // Call the authentication service to register the user
    this.authService.register(thisForm.email, thisForm.displayName, thisForm.password).subscribe({
      next: () => {
        console.log('Registration successful');
      },
      // error: (err) => {
      //   // Set error message if registration fails
      //   this.errorMessage = err.code;
      // }
    });
  }
}
