import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { map } from 'rxjs';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'DABubble';
  firestore: Firestore = inject(Firestore);
  private userService = inject(UserService);

  constructor() {}

  ngOnInit() {
    const usersRef = collection(this.firestore, 'users');

    // this.userService.getUserById('gE48Y93bLDaZ2cZXJmwY').subscribe((user) => {
    //   console.log('Test User:', user);
    // });

    // collectionData(usersRef).pipe(
    //   map((users: any[]) => users.map(user => user.name))
    // ).subscribe(userNames => {
    //   console.log('User-Namen aus Firestore:', userNames);
    // });
  }
}
