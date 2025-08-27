import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FormControl, FormsModule, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';

import { UserService } from '../../../services/user.service';
import { AngularFireFunctions } from '@angular/fire/compat/functions';

import { CommonModule } from '@angular/common';
import { AuthState } from '../../../shared/auth-state.type';
import { user, getAuth, sendEmailVerification } from '@angular/fire/auth';
import { flatMap } from 'rxjs';

import { Router } from '@angular/router';

@Component({
  selector: 'app-confirm-password',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './confirm-password.component.html',
  styleUrl: './confirm-password.component.scss'
})
export class ConfirmPasswordComponent implements OnInit {
  @Output() changeAuthState = new EventEmitter<AuthState>();

  showErrorMessage: boolean = false;
  wavieFlagie: boolean = false;

  emailList: string[] = [];
  userColl: any;

  confirmForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });
  userList!: any[];
  functions: any;

  constructor(
    private userService: UserService,
    private router: Router,
    private authService: AuthService
  ) { }

  /**
   * Get on init list of all emails and UIDs from firestore
   */
  ngOnInit(): void {
    this.userService.getAllUserEmails().subscribe((users: any) => {
      this.emailList = users.map((user: { email: any; }) => user.email);
      users.forEach((user: { uid: any; email: any; }) => {
        console.log(`UID: ${user.uid}, EMAIL: ${user.email}`);
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
     this.authService.sendPasswordRessetEmail(inputMail).then(() => {
      this.waveFlag();
      setTimeout(() => {
        console.log('Mail erfolgreich gesendet');
        this.backToLogin();
      }, 1500);
     }).catch((error) => {
      console.error('Password_rest E-Mail konnte nicht gesendet werden', error);
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
   * Shows "mail send" message bevor function "procedToReset"
   */
  waveFlag() {
    let wavieFlagie = document.querySelector('.flag');
    wavieFlagie?.classList.add('showFlag');
  }

  /**
  * Sends linkt to reset password to found email
  */
  sendPasswortResset(email: string) {
    this.authService.sendPasswordRessetEmail(email).then(() => {
      this.waveFlag();
    }).catch((error) => {
      console.error('Fehler beim senden der Reset-Mail', error);
    })
  }
}
