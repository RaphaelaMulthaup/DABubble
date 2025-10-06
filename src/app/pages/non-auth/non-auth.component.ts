import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { LoginFormComponent } from './login-form/login-form.component';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { map } from 'rxjs';
import { RegisterFormComponent } from './register-form/register-form.component';
import { IntroComponent } from './intro/intro.component';
import { AvatarSelectionComponent } from './avatar-selection/avatar-selection.component';
import { AuthState } from '../../shared/types/auth-state.type';
import { RouterLink } from '@angular/router';
import { ConfirmPasswordComponent } from './confirm-password/confirm-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { CreateAccountBtnComponent } from '../../shared/components/create-account-btn/create-account-btn.component';
import { HeaderOutsideDashboardComponent } from '../../shared/components/header-outside-dashboard/header-outside-dashboard.component';
import { UserToRegisterInterface } from '../../shared/models/user.to.register.interface';

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
  currentState: AuthState = 'login';
  userToRegister: UserToRegisterInterface = {
    displayName: '',
    email: '',
    password: '',
    policyAccepted: false,
    photoURL: '',
  };
  showConfirm: boolean = false;
  showLogin: boolean = true;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private route: ActivatedRoute
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
    this.handleIntroState();

    // URL-Parameter abfragen
    this.route.queryParams.subscribe((params) => {
      const uid = params['uid'];
      if (uid) {
        // Es wurde ein uid-Parameter erkannt, also gehe in den 'reset-password' Modus
        this.currentState = 'reset-password-confirm';
      }
    });

    collectionData(usersRef)
      .pipe(map((users: any[]) => users.map((user) => user.name)))
  }

  /**
   * Repalced the animted logo with the actual one.
   */
  showLogo() {
    let shownLogo = document.querySelector('.logo');
    shownLogo?.classList.add('show-logo');
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

  /**
   * shows intro animation only if currentState is "login"
   */
  handleIntroState() {
    if ((this.currentState = 'login')) {
      this.showLogo();
    } else {
      this.noIntro();
    }
  }

  /**
   * Make sure page is displayed correct if currentState is not "login"
   */
  noIntro() {
    let intro = document.querySelector('.intro');
    let showLogo = document.querySelector('.logo');

    intro?.classList.add('hide');
    showLogo?.classList.add('.show-logo');
  }
}
