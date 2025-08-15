import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { LoginFormComponent } from './login-form/login-form.component';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { map } from 'rxjs';
import { RegisterFormComponent } from "./register-form/register-form.component";

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-non-auth',
  imports: [CommonModule, LoginFormComponent, RegisterFormComponent],
  templateUrl: './non-auth.component.html',
  styleUrl: './non-auth.component.scss'
})
export class NonAuthComponent {
  // Flag to toggle between login and register forms
  noAccount: boolean = false;

  // Firestore instance injected for database operations
  firestore: Firestore = inject(Firestore);

  // AuthService instance injected for authentication methods
  authService = inject(AuthService);

  constructor(private auth: Auth, private router: Router) {
    // Listen for authentication state changes
    onAuthStateChanged(this.auth, user => {
      if (user) {
        // Navigate to dashboard if user is logged in
        this.router.navigate(['/dashboard']);
      } else {
        // Log a message if no user is logged in and navigate to home
        console.log('No user is logged in');
        this.router.navigate(['/']);
      }
    });
  }

  /**
   * Toggle the noAccount flag to switch between login and registration view
   */
  toggleNoAccount() {
    this.noAccount = !this.noAccount;
  }

  /**
   * Lifecycle hook: Runs on component initialization
   * Fetches all users from Firestore and logs their names
   */
  ngOnInit() {
    const usersRef = collection(this.firestore, 'users');

    collectionData(usersRef).pipe(
      map((users: any[]) => users.map(user => user.name))
    ).subscribe(userNames => {
      console.log('User names from Firestore:', userNames);
    });
  }
}
