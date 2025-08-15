import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { map } from 'rxjs';
import { UserService } from './services/user.service';
import { ChatService } from './services/chat.service';
import { ThreadService } from './services/thread.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  // Title of the application
  title = 'DABubble';

  // Firestore instance for database access
  firestore: Firestore = inject(Firestore);

  // Service to manage user-related operations
  private userService = inject(UserService);

  // Service to manage chat-related operations
  private chatService = inject(ChatService);

  // Service to manage thread-related operations
  private threadService = inject(ThreadService);

  constructor() {}

  // Lifecycle hook that runs when the component is initialized
  ngOnInit() {
  }
}
