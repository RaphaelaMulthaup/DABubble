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
    this.threadService.getThreadMessages('9iTo1zxP7AbfJimTOCTE').subscribe((messages)=>{console.log('HIer die Messages', messages);
    })
    // this.chatService
    //   .getReactions('VbD4ZPbP1AKwJkS62JHG', '6RHZYXVjoHnu7IF6blVl')
    //   .subscribe((reactions) => {
    //     console.log('meine reactions', reactions);
    //   });
    //   this.chatService.toggleReaction(
    //   'VbD4ZPbP1AKwJkS62JHG',
    //   '6RHZYXVjoHnu7IF6blVl',
    //   'sun',
    //   'userId5'
    // )
    // this.chatService
    //   .getMessages('VbD4ZPbP1AKwJkS62JHG')
    //   .subscribe((messages) => {
    //     console.log('hier die Nachrichten', messages);
    //   });
    // let message = {
    //   senderId: 'userId6',
    //   text: 'Einen direkte Nachricht im Chat',
    // };
    // this.chatService.sendMessage('VbD4ZPbP1AKwJkS62JHG', message);
  }
}
