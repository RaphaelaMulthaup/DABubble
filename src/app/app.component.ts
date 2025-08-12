import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { map } from 'rxjs';
import { UserService } from './services/user.service';
import { ChatService } from './services/chat.service';

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

  constructor() {}

  ngOnInit() {
    // this.chatService
    //   .getReactions('gQSCQ7XLFTQAu9eDpHQz', 'MHRwE4cmeSN0LVpHjnsW')
    //   .subscribe((reactions) => {
    //     console.log('Hier die Reaktionen:', reactions);
    //   });

    // this.chatService.toggleReaction('gQSCQ7XLFTQAu9eDpHQz', 'MHRwE4cmeSN0LVpHjnsW', 'summer', 'UserId67');

    // this.chatService
    //   .getMessages('VbD4ZPbP1AKwJkS62JHG')
    //   .subscribe((messages) => {
    //     console.log('hier die Nachtrichten', messages);
    //   });

    // let message = {
    //   senderId: 'XbsVa8YOj8Nd9vztzX1kAQXrc7Z2',
    //   text: 'Ich teste hier rum.',
    // };
    // this.chatService.sendMessage('VbD4ZPbP1AKwJkS62JHG', message);

    // this.chatService.getChatById('gQSCQ7XLFTQAu9eDpHQz').subscribe((chat)=>{console.log('Das ist der chat', chat);
    // });

    // this.userService.getAllUsers().subscribe((users) => {
    //   console.log('alle user', users);
    // });

    // collectionData(usersRef).pipe(
    //   map((users: any[]) => users.map(user => user.name))
    // ).subscribe(userNames => {
    //   console.log('User-Namen aus Firestore:', userNames);
    // });
  }
}
