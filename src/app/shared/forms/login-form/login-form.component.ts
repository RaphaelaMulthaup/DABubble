
import { Component , inject} from '@angular/core';

import { AuthService } from '../../../services/auth.service';
import { FormControl, FormsModule, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login-form',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss'
})
export class LoginFormComponent {
  authService = inject(AuthService);
  errorMessage: string | null = null;

  loginForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  constructor() {}

 onSubmit(): void {
   const email = this.loginForm.get('email')?.value;
   const password = this.loginForm.get('password')?.value;
   this.authService.login(email, password).subscribe({
     next: () => {
       console.log('Login successful');
     },
     error: (err) => {
       this.errorMessage = err.code;
     }
   });
  }
}
