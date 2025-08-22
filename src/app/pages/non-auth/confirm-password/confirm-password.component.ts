import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FormControl, FormsModule, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';

import { UserService } from '../../../services/user.service';

import { CommonModule } from '@angular/common';
import { AuthState } from '../../../shared/auth-state.type';

@Component({
  selector: 'app-confirm-password',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './confirm-password.component.html',
  styleUrl: './confirm-password.component.scss'
})
export class ConfirmPasswordComponent implements OnInit {
  @Output() changeAuthState = new EventEmitter<AuthState>();

  authService = inject(AuthService);
  showErrorMessage: boolean = false;
  emailList: string[] = [];
  userColl: any;

  confirmForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  constructor(private userService: UserService) { }

  /**
   * Get on init list of all emails from firestore
   */
  ngOnInit(): void {
      this.userService.getAllUserEmails().subscribe((users: any[]) => {
        this.emailList = users.map(user => user.email);
        this.emailList.forEach(email => {
          console.log(`Email: ${email}`);
        })
      })
  }

  /**
   * Compares email from input with emails from loaded mail list.
   * Throws error message if no matching mail
   */
  onSubmit() {
    console.log('onSub');
    let inputMail = this.confirmForm.get('email')?.value;
    if (this.emailList.includes(inputMail)) {
      console.log('E-mail vorhanden');
    } else {
      this.showErrorMessage = true;
    }
  }

  /**
   * This function emits the showLogin-variable to change the non-auth-components variable noAccount to false.
   */
  backToLogin() {
    this.changeAuthState.emit('login');
    this.authService.emptyUserObject();
  }
}
