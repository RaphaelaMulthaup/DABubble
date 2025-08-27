import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { AuthState } from '../../../shared/auth-state.type';
import { FormControl, FormsModule, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { Firestore, collection, collectionData, query, where, getDocs } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IntroComponent } from '../intro/intro.component';
import { HeaderComponent } from '../../../shared/components/header/header.component';

@Component({
  selector: 'app-reset-password',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    IntroComponent,
    HeaderComponent,
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit{
  registerForm!: FormGroup;
  showErrorMessage: boolean = false;
  uid!: string;

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
}
