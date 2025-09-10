import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { LoginFormComponent } from './login-form/login-form.component';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { flatMap, map } from 'rxjs';
import { RegisterFormComponent } from './register-form/register-form.component';

import { AuthService } from '../../services/auth.service';
import { IntroComponent } from './intro/intro.component';
import { AvatarSelectionComponent } from './avatar-selection/avatar-selection.component';
import { AuthState } from '../../shared/types/auth-state.type';
import { RouterLink } from '@angular/router';
import { ConfirmPasswordComponent } from './confirm-password/confirm-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { FormControl, FormGroup } from '@angular/forms';
import { CreateAccountBtnComponent } from '../../shared/components/create-account-btn/create-account-btn.component';
import { HeaderOutsideDashboardComponent } from '../../shared/components/header-outside-dashboard/header-outside-dashboard.component';

@Component({
  selector: 'app-non-auth',
  imports: [
    CommonModule,
    LoginFormComponent,
    RegisterFormComponent,
    AvatarSelectionComponent,
    RouterLink,
    HeaderOutsideDashboardComponent,
    ConfirmPasswordComponent,
    ResetPasswordComponent,
    CreateAccountBtnComponent,
    IntroComponent,
  ],
  templateUrl: './non-auth.component.html',
  styleUrl: './non-auth.component.scss',
})
export class NonAuthComponent {
  // the currently shown non-auth-component
  currentState: AuthState = 'login';
  showConfirm: boolean = false;
  showLogin: boolean = true;
  showIntro: any;

  constructor(
    private auth: Auth,
    private router: Router,
    private route: ActivatedRoute,
    private firestore: Firestore,
    private authService: AuthService
  ) {
    const navaigation = this.router.getCurrentNavigation();
    const uid = navaigation?.extras.state?.['uid'];
    // Listen for authentication state changes
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        // Navigate to dashboard if user is logged in
        this.router.navigate(['/dashboard']);
      } else {
        // Log a message if no user is logged in and navigate to home
        //console.log('No user is logged in');
        this.router.navigate(['/']);
      }
    });
    const usersRef = collection(this.firestore, 'users');
  }

  /**
   * Lifecycle hook: Runs on component initialization
   * Fetches all users from Firestore and logs their names
   */
  ngOnInit() {
    const usersRef = collection(this.firestore, 'users');
    this.showLogo();

    // URL-Parameter abfragen
    this.route.queryParams.subscribe((params) => {
      const uid = params['uid'];
      if (uid) {
        // Es wurde ein uid-Parameter erkannt, also gehe in den 'reset-password' Modus
        this.currentState = 'reset-password-confirm';
      }
    });

    collectionData(usersRef).pipe(
      map((users: any[]) => users.map(user => user.name))
    ).subscribe(userNames => {
      console.log('User names from Firestore:', userNames);
    });
  }

  /**
   * Repalced the animted logo with the actual one.
   */
  showLogo() {
    let shownLogo = document.querySelector('.logo');
    setTimeout(() => {
      shownLogo?.classList.add('show-logo');
    }, 5600);
  }

  onForgotPassword() {
    this.currentState = 'reset-password-init';
  }

  hideResetPassword() {
    this.currentState = 'login';
  }

  procedToReset() {
    this.currentState = 'reset-password-confirm';
  }
}
