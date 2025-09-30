import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  Validators,
} from '@angular/forms';

import { UserService } from '../../../services/user.service';
import { AngularFireFunctions } from '@angular/fire/compat/functions';

import { CommonModule } from '@angular/common';
import { AuthState } from '../../../shared/types/auth-state.type';
import { user, getAuth, sendEmailVerification } from '@angular/fire/auth';
import { flatMap } from 'rxjs';

import { Router } from '@angular/router';

@Component({
  selector: 'app-confirm-password',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './confirm-password.component.html',
  styleUrl: './confirm-password.component.scss',
})
export class ConfirmPasswordComponent implements OnInit {
  @Output() changeAuthState = new EventEmitter<AuthState>();
  @Input() oobCode!: string;

  showErrorMessage: boolean = false;
  showToast: boolean = false;

  emailList: string[] = [];
  emailExists: boolean = false;
  userColl: any;

  confirmForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });
  userList!: any[];
  functions: any;

  constructor(
    private userService: UserService,
    private router: Router,
    private authService: AuthService
  ) {}

  /**
   * Get on init list of all emails and UIDs from firestore
   */
  ngOnInit(): void {
 
  }

  veriyResetCode() {
    throw new Error('Method not implemented.');
  }

  /**
   * Compares email from input with emails from loaded mail list.
   * Throws error message if no matching mail
   */
  async onSubmit() {
    const inputEmail = this.confirmForm.get('email')?.value;
    const uid = await this.userService.checkMailAndUid(inputEmail);

    if (uid) {
      this.authService.sendPasswordResetEmail(inputEmail).then(() => {
        this.showToast = true;
        setTimeout(() => {
          this.backToLogin();
        }, 1500);
      }).catch((error) => {
        console.error('Reset-Mail konnte nicht versendet werden', error);
        this.showErrorMessage = true;
      });
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

  /**
   * Proced to "reset-password"
   */
  procedToReset() {
    this.changeAuthState.emit('reset-password-confirm');
  }

  /**
   * Sends linkt to reset password to found email
   */
  sendPasswortResset(email: string) {
    this.authService
      .sendPasswordResetEmail(email)
      .then(() => {
        // this.waveFlag();
        this.showToast = true;
      })
      .catch((error) => {
        console.error('Fehler beim senden der Reset-Mail', error);
      });
  }
}
