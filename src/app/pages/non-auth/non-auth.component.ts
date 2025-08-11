import { Component, inject  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { LoginFormComponent } from "../../shared/forms/login-form/login-form.component";

import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { map } from 'rxjs';
import { RegisterFormComponent } from "../../shared/forms/register-form/register-form.component";

@Component({
  selector: 'app-non-auth',
  imports: [CommonModule, LoginFormComponent, RegisterFormComponent],
  templateUrl: './non-auth.component.html',
  styleUrl: './non-auth.component.scss'
})
export class NonAuthComponent {

  firestore: Firestore = inject(Firestore);

  constructor(private auth: Auth, private router: Router) {
    onAuthStateChanged(this.auth, user => {
      if (user) {
         this.router.navigate(['/dashboard']);
      } else {
        console.log('No user is logged in');
        this.router.navigate(['/']);
      }
    });
  }

    ngOnInit() {
    const usersRef = collection(this.firestore, 'users');

    collectionData(usersRef).pipe(
      map((users: any[]) => users.map(user => user.name))
    ).subscribe(userNames => {
      console.log('User-Namen aus Firestore:', userNames);
    });
  }
}
