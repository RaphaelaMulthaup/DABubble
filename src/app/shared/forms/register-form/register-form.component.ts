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
  authService = inject(AuthService);
  errorMessage: string | null = null;

  registerForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    displayName: new FormControl('', [Validators.required])
  });
  constructor() {

  }

 onSubmit(): void {
   const email = this.registerForm.get('email')?.value;
   const password = this.registerForm.get('password')?.value;
   const displayName = this.registerForm.get('displayName')?.value;
   this.authService.register(email, displayName, password).subscribe({
     next: () => {
       console.log('Registration successful');
     },
     error: (err) => {
       this.errorMessage = err.code;
     }
   });
  }
}
