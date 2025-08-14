import { Component, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FormControl, FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; 

@Component({
  selector: 'app-register-form',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.scss'
})
export class RegisterFormComponent {
  // Injects the authentication service
  authService = inject(AuthService);

  // Holds any error messages during registration
  errorMessage: string | null = null;

  // Defines the registration form with validators for email, password, and display name
  registerForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    displayName: new FormControl('', [Validators.required])
  });

  constructor() {
    // Constructor remains empty
  }

  // Handles form submission
  onSubmit(): void {
    // Get raw form values
    const thisForm = this.registerForm.getRawValue();

    // Call the authentication service to register the user
    this.authService.register(thisForm.email, thisForm.displayName, thisForm.password).subscribe({
      next: () => {
        console.log('Registration successful');
      },
      error: (err) => {
        // Set error message if registration fails
        this.errorMessage = err.code;
      }
    });
  }
}
