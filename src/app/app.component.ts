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
    // let message = {
    //   senderId: 'userId56',
    //   text: 'Antwort im Thread',
    // };
    // this.threadService.sendThreadMessage('9iTo1zxP7AbfJimTOCTE', message);

    // this.threadService.createThreadWithFirstMessage(
    //   '9ceprLo5VynWRuNVajFQ',
    //   'userId6',
    //   'Neuer Thread!!'
    // );
    // this.threadService
    //   .getThreadsForChannel('9ceprLo5VynWRuNVajFQ')
    //   .subscribe((threads) => {console.log('hier die threads', threads);
    //   });
    // this.threadService.createThread('9ceprLo5VynWRuNVajFQ', 'userId66');
  }
}
