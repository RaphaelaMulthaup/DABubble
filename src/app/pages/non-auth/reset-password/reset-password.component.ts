import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FormControl, FormsModule, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { Firestore, collection, collectionData, query, where, getDocs } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IntroComponent } from '../intro/intro.component';
import { AuthState } from '../../../shared/types/auth-state.type';


@Component({
  selector: 'app-reset-password',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    IntroComponent,
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit{
    @Output() changeAuthState = new EventEmitter<AuthState>();

  registerForm!: FormGroup;
  showErrorMessage: boolean = false;
  uid!: string;
  showToast: boolean = false;

  constructor(
    private autService : AuthService,
    private router: Router
  ) {
      const navigation = this.router.getCurrentNavigation();
      this.uid = navigation?.extras.state?.['uid'];
  }

  ngOnInit(): void {
      this.registerForm = new FormGroup({
        password: new FormControl('', [Validators.required, Validators.minLength(6)]),
        passwordConfirm: new FormControl('', [Validators.required, Validators.minLength(6)])
      })
  }

  onSubmit() {
    console.log('boing');
    this.checkPasswords();
  }

  /**
   * check if input is valid
   */
  checkPasswords() {
    let password = this.registerForm.get('password')?.value
    let passwordConfirm = this.registerForm.get('passwordConfirm')?.value;

    if (password && passwordConfirm) {
      this.showErrorMessage = password !== passwordConfirm;
    } else {
      this.showErrorMessage = false;
    }
  }

  /**
   * function prototype top change user password
   */
  onPasswordChange() {

  }
  
  backToLogin() {
    this.changeAuthState.emit('login');
  }

  shwoToast() {}
}
