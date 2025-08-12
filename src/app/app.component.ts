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
  title = 'DABubble';
  firestore: Firestore = inject(Firestore);
  private userService = inject(UserService);
  private chatService = inject(ChatService);
  private threadService = inject(ThreadService);

  constructor() {}

  ngOnInit() {
    // this.threadService.createThread('9ceprLo5VynWRuNVajFQ', 'userId66');
  }
}
