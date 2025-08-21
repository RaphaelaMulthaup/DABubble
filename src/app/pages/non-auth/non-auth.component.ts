import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { LoginFormComponent } from './login-form/login-form.component';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { flatMap, map } from 'rxjs';
import { RegisterFormComponent } from "./register-form/register-form.component";

import { AuthService } from '../../services/auth.service';
import { IntroComponent } from './intro/intro.component';
import { AvatarSelectionComponent } from "./avatar-selection/avatar-selection.component";
import { AuthState } from '../../shared/auth-state.type';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ConfirmPasswordComponent } from './confirm-password/confirm-password.component';

@Component({
  selector: 'app-non-auth',
  imports: [CommonModule, LoginFormComponent, RegisterFormComponent, IntroComponent, AvatarSelectionComponent, RouterLink, HeaderComponent, ConfirmPasswordComponent],
  templateUrl: './non-auth.component.html',
  styleUrl: './non-auth.component.scss'
})
export class NonAuthComponent implements OnInit {
  // the currently shown non-auth-component
  currentState: AuthState = 'login';

  // Firestore instance injected for database operations
  firestore: Firestore = inject(Firestore);

  // AuthService instance injected for authentication methods
  authService = inject(AuthService);

  showConfirm: boolean = false;
  showLogin: boolean = true;

  constructor(private auth: Auth, private router: Router) {
    // Listen for authentication state changes
    onAuthStateChanged(this.auth, user => {
      if (user) {
        // Navigate to dashboard if user is logged in
        this.router.navigate(['/dashboard']);
      } else {
        // Log a message if no user is logged in and navigate to home
        //console.log('No user is logged in');
        this.router.navigate(['/']);
      }
    });
  }

  /**
   * Lifecycle hook: Runs on component initialization
   * Fetches all users from Firestore and logs their names
   */
  ngOnInit() {
    const usersRef = collection(this.firestore, 'users');
    this.showLogo();

    collectionData(usersRef).pipe(
      map((users: any[]) => users.map(user => user.name))
    ).subscribe(userNames => {
      //console.log('User names from Firestore:', userNames);
    });
  }

  /**
   * Repalced the animted logo with the actual one.
   */
  showLogo() {
    let shownLogo = document.querySelector(".logo");
    setTimeout(() => {
      shownLogo?.classList.add("show-logo");
    }, 5600);
  }

  onForgotPassword() {
    this.currentState = 'reset-password-init';
  }

  hideResetPassword() {
    this.currentState = 'login';
  }
}
