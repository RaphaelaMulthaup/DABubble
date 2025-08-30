import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { AuthState } from '../../../shared/auth-state.type';
import { FormControl, FormsModule, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { Firestore, collection, collectionData, query, where, getDocs, doc, getDoc } from '@angular/fire/firestore';
import { Auth, user, getAuth, verifyPasswordResetCode, confirmPasswordReset } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';

@Component({
  selector: 'app-reset-password',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterLink
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

  constructor(
    private route: ActivatedRoute,
    private authService : AuthService,
    private router: Router
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
   * Check if sended oobCode is still valid.
   */
  verifyResetCode() {
    const auth = getAuth();
    verifyPasswordResetCode(auth, this.oobCode).then((email) => {
      this.email = email;
    }).catch((error) => {
      console.error('Ungültiger oder angelöaufenenr Aktionscode', error);
      this.showErrorMessage = true;
    })
  }

 /**
  * Fetch Email and UserId
  */
  async fetchUserEmail() {
    const usersRef = doc(this.firestore, 'users', this.uid);
    const userSnap = await getDoc(usersRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        this.email = userData['email'];
      }
  }

  onSubmit() {
    this.checkPasswords();

    if (!this.showErrorMessage) {
      this.resetPassword();
    }
  }

  navigateToNonAuth(event: Event) {
    location.reload();
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
      this.waveFlag();
      setTimeout(() => {
        location.reload();
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
    this.router.navigate([""]);
  }

  /**
   * shows success message
   */
  waveFlag() {
    let wavieFlagie = document.querySelector('.flag-resset');
    wavieFlagie?.classList.add('showFlag');
  }
}
