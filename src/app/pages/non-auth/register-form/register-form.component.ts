import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthState } from '../../../shared/types/auth-state.type';
import { UserService } from '../../../services/user.service';
import { UserToRegisterInterface } from '../../../shared/models/user.to.register.interface';

@Component({
  selector: 'app-register-form',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.scss',
})
export class RegisterFormComponent {
  @Input() userToRegister!: UserToRegisterInterface;
  @Output() changeAuthState = new EventEmitter<AuthState>();
  emailExists: boolean = false;
  registerForm!: FormGroup; // Defines the registration form with validators for email, password, and display name

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.initForm();
  }

  ngOnChanges() {
    if (this.userToRegister) this.initForm();
  }

  initForm() {
    this.registerForm = new FormGroup({
      displayName: new FormControl(this.userToRegister.displayName, [
        Validators.required,
      ]),
      email: new FormControl(this.userToRegister.email, [
        Validators.required,
        Validators.email,
      ]),
      password: new FormControl(this.userToRegister.password, [
        Validators.required,
        Validators.minLength(6),
      ]),
      policyAccepted: new FormControl(this.userToRegister.policyAccepted, [
        Validators.required,
      ]),
    });
  }

  /**
   * This function emits the showLogin-variable to change the non-auth-components variable noAccount to false.
   */
  backToLogin() {
    this.changeAuthState.emit('login');
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
    this.registerForm.value.policyAccepted =
      !this.registerForm.value.policyAccepted;
  }

  /**
   * Handles form submission.
   * On submit, the userToRegister-data is set to the input values.
   */
  onSubmit(): void {
    const thisForm = this.registerForm.value;
    this.userToRegister.displayName = thisForm.displayName;
    this.userToRegister.email = thisForm.email;
    this.userToRegister.password = thisForm.password;
    this.userToRegister.policyAccepted = true;
    this.changeAuthState.emit('registration-avatar');
  }
}
