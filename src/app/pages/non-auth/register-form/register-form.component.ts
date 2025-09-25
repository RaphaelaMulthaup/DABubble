import { Component, EventEmitter, inject, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthState } from '../../../shared/types/auth-state.type';
import { UserService } from '../../../services/user.service';
import { UserInterface } from '../../../shared/models/user.interface';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register-form',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.scss',
})
export class RegisterFormComponent {
  // whether the entered emai-exists or not (checked onblur of the mail input)
  emailExists: boolean = false;
  // Defines the registration form with validators for email, password, and display name
  registerForm: FormGroup;
  @Output() changeAuthState = new EventEmitter<AuthState>();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private http: HttpClient
  ) {
    this.registerForm = new FormGroup({
      displayName: new FormControl(
        this.authService.userToRegister.displayName,
        [Validators.required]
      ),
      email: new FormControl(this.authService.userToRegister.email, [
        Validators.required,
        Validators.email,
      ]),
      password: new FormControl(this.authService.userToRegister.password, [
        Validators.required,
        Validators.minLength(6),
      ]),
      policyAccepted: new FormControl(
        this.authService.userToRegister.policyAccepted,
        [Validators.required]
      ),
    });
  }

  /**
   * This function emits the showLogin-variable to change the non-auth-components variable noAccount to false.
   */
  backToLogin() {
    this.changeAuthState.emit('login');
    this.authService.emptyUserObject();
  }

  /**
   * This function sets the emailExists-variable.
   */
  async checkForExistingUser() {
    this.emailExists = await this.userService.checkForExistingUser(
      this.registerForm.value.email
    );
  }

  /**
   * This function toggles the checkboxChecked-variable to change the checkbox' appearence.
   */
  toggleCheckboxChecked() {
    // this.checkboxChecked = !this.checkboxChecked;
    // this.registerForm.value.policyAccepted = this.checkboxChecked;
    this.registerForm.value.policyAccepted =
      !this.registerForm.value.policyAccepted;
  }

  // Handles form submission.
  // On submit, the userToRegister-data is set to the input values.
  onSubmit(): void {
    const thisForm = this.registerForm.value;

    this.authService.userToRegister.displayName = thisForm.displayName;
    this.authService.userToRegister.email = thisForm.email;
    this.authService.userToRegister.password = thisForm.password;
    this.authService.userToRegister.policyAccepted = true;
    this.changeAuthState.emit('registration-avatar');
  }

  registerUser() {
    this.authService.register().subscribe(() => {
      const user = this.authService.currentUser;
      if (user) {
        const email = user.email;
        const name = this.registerForm.get('displayName')?.value;
      }
    });
  }
}
