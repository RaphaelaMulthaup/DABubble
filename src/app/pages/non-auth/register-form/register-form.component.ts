import { Component, EventEmitter, inject, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FormControl, FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthState } from '../../../shared/auth-state.type';
import { UserService } from '../../../services/user.service';
import { UserInterface } from '../../../shared/models/user.interface';

@Component({
  selector: 'app-register-form',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.scss'
})
export class RegisterFormComponent {
  // Injects the authentication service
  authService = inject(AuthService);
  userService = inject(UserService);

  emailExists: boolean = false;

  // //users: UserInterface[] = [];
  // userEmails: string[] = [];

  // Defines the registration form with validators for email, password, and display name
  registerForm: FormGroup = new FormGroup({
    displayName: new FormControl(this.authService.userToRegister.displayName, [Validators.required]),
    email: new FormControl(this.authService.userToRegister.email, [Validators.required, Validators.email]),
    password: new FormControl(this.authService.userToRegister.password, [Validators.required, Validators.minLength(6)]),
    policyAccepted: new FormControl(this.authService.userToRegister.policyAccepted, [Validators.required])
  });

  @Output() changeAuthState = new EventEmitter<AuthState>();

  constructor() {
    // Constructor remains empty
  }

  // /**
  //  * OnInit the userEmails-string is filled with all user-emails.
  //  */
  // ngOnInit() {
  //   this.userService.getAllUsers().subscribe(userData => {
  //     userData.forEach((user) => this.userEmails.push(user.email))
  //   });
  //   console.log(this.userEmails)
  // }

  /**
   * This function emits the showLogin-variable to change the non-auth-components variable noAccount to false.
   */
  backToLogin() {
    this.changeAuthState.emit('login');
    this.authService.emptyUserObject();
  }

  /**
 * This function checks if the entered email already exists as a user. If so, the corresponding error message is shown.
 */
  async checkForExistingUser() {
    // const emailExists = await this.userService.checkForExistingUser(this.registerForm.value.email);
    // if (emailExists) return true;
    // return false;
    this.emailExists = await this.userService.checkForExistingUser(this.registerForm.value.email);
  }

  /**
   * This function toggles the checkboxChecked-variable to change the checkbox' appearence.
   */
  toggleCheckboxChecked() {
    // this.checkboxChecked = !this.checkboxChecked;
    // this.registerForm.value.policyAccepted = this.checkboxChecked;
    this.registerForm.value.policyAccepted = !this.registerForm.value.policyAccepted;
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
}
