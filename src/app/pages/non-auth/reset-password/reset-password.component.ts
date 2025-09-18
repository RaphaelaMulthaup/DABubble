import { ChangeDetectorRef, Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';

import { FormControl, FormsModule, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { Firestore, collection, collectionData, query, where, getDocs, doc, getDoc } from '@angular/fire/firestore';
import { Auth, user, getAuth, verifyPasswordResetCode, confirmPasswordReset } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthState } from '../../../shared/types/auth-state.type';


@Component({
  selector: 'app-reset-password',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit{
  @Output() changeAuthState = new EventEmitter<AuthState>();
  firestore: Firestore = inject(Firestore);
  registerForm!: FormGroup;
  showErrorMessage: boolean = false;
  uid!: string;
  oobCode!: string; 
  email: any;
  showToast: any;

  constructor(
    private route: ActivatedRoute,
    private authService : AuthService,
    private router: Router,
  ) {
      const navigation = this.router.getCurrentNavigation();
      this.uid = navigation?.extras.state?.['uid'];
  }

  ngOnInit(): void {
    this.oobCode = this.route.snapshot.queryParams['oobCode'] ?? '';

    this.registerForm = new FormGroup({ 
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      passwordConfirm: new FormControl('', [Validators.required, Validators.minLength(6)])
     });
     this.verifyResetCode();
  }

  /**
   * Checks on any interaction if inputs are identical
   */
  ngDoCheck(): void {
    this.checkPasswords();
  }

  /**
   * Check if sended oobCode is still valid.
   */
  verifyResetCode() {
    const auth = getAuth();
    verifyPasswordResetCode(auth, this.oobCode).then((email) => {
      this.email = email;
    }).catch((error) => {
      console.error('Ungültiger oder abgelaufener Aktionscode', error);
      this.showErrorMessage = true;
    })
  }

  onSubmit() {
    this.checkPasswords();

    if (!this.showErrorMessage) {
      this.resetPassword();
    }
  }

  /**
   * check if input is valid
   */
  checkPasswords() {
    let password = this.registerForm.get('password')?.value;
    let passwordConfirm = this.registerForm.get('passwordConfirm')?.value;

    this.showErrorMessage = password !== passwordConfirm;
  }

  /**
   * Saves the new password
   */
  resetPassword() {
    const auth = getAuth();
    const newPassword = this.registerForm.get('password')?.value;

    confirmPasswordReset(auth, this.oobCode, newPassword).then(() => {
      this.showToast = true;
      setTimeout(() => {
        this.backToLogin();
      }, 1500);
    }).catch((error) => {
      console.error('Fehler beim Zurücksetzen des Passworts', error);
      this.showErrorMessage = true;
    })
  }

  /**
   * This function emits the showLogin-variable to change the non-auth-components variable noAccount to false.
   */
  backToLogin() {
    this.changeAuthState.emit('login');
    location.reload();
  }

}
