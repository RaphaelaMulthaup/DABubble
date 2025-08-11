import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { map } from 'rxjs';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'DABubble';
  firestore: Firestore = inject(Firestore);

  constructor(private auth: Auth, private router: Router) {
    onAuthStateChanged(this.auth, user => {
      if (user) {
         this.router.navigate(['/dashboard']);
      } else {
        console.log('No user is logged in');
        this.router.navigate(['/login']);
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
