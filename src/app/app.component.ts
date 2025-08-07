import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { map } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'DABubble';
  firestore: Firestore = inject(Firestore);

  constructor() {

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
