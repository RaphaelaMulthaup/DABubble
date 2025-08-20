import { Component, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FormControl, FormsModule, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { Firestore, collection, collectionData, query, where, getDocs } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent {
  registerForm!: FormGroup;
  showErrorMessage: boolean = false;

  constructor(private autService : AuthService) {
    this.registerForm = new FormGroup({
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      passwordConfirm: new FormControl('', [Validators.required, Validators.minLength(6)])
    });

    this.registerForm.valueChanges.subscribe(() => {
      this.checkPasswords();
    })
  }

  onSubmit() {
    console.log('boing');
    this.checkPasswords();
  }

  checkPasswords() {
    let password = this.registerForm.get('password')?.value
    let passwordConfirm = this.registerForm.get('passwordConfirm')?.value;

    if (password && passwordConfirm) {
      this.showErrorMessage = password !== passwordConfirm;
    } else {
      this.showErrorMessage = false;
    }
  }
}
