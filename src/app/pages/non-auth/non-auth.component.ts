import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { LoginFormComponent } from './login-form/login-form.component';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { RegisterFormComponent } from './register-form/register-form.component';
import { IntroComponent } from './intro/intro.component';
import { AvatarSelectionComponent } from './avatar-selection/avatar-selection.component';
import { AuthState } from '../../shared/types/auth-state.type';
import { RouterLink } from '@angular/router';
import { ConfirmPasswordComponent } from './confirm-password/confirm-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { CreateAccountBtnComponent } from '../../shared/components/create-account-btn/create-account-btn.component';
import { HeaderOutsideDashboardComponent } from '../../shared/components/header-outside-dashboard/header-outside-dashboard.component';
import { ScreenSize } from '../../shared/types/screen-size.type';
import { ScreenService } from '../../services/screen.service';
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
  screenSize$!: Observable<ScreenSize>;
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
  showIntro: any;
  introPlayed: boolean = false;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private route: ActivatedRoute,
    private router: Router,
    public screenService: ScreenService
  ) {
    this.screenSize$ = this.screenService.screenSize$;

    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  ngOnInit() {
    const introPlayedStorage = localStorage.getItem('introPlayed');
    this.introPlayed = introPlayedStorage === 'true';
    
    const usersRef = collection(this.firestore, 'users');
    this.route.queryParams.subscribe((params) => {
      const uid = params['uid'];
      if (uid) this.currentState = 'reset-password-confirm';
    });
    collectionData(usersRef).pipe(map((users: any[]) => users.map((user) => user.name)));
    this.removeBackGround();
  }

  /**
   * Removes background of animation
   */
  removeBackGround() {
    let backGround = document.querySelector('.back-ground');
    
    if (this.introPlayed) {
      backGround?.classList.add('hideBack');
    } else {
      setTimeout(() => {
        backGround?.classList.add('hideBack');
      }, 3500);
    }
  }

  /**
   * Sets the currentState to 'reset-password-init'.
   */
  onForgotPassword() {
    this.currentState = 'reset-password-init';
  }

  /**
   * Sets the currentState to 'login'.
   */
  hideResetPassword() {
    this.currentState = 'login';
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
