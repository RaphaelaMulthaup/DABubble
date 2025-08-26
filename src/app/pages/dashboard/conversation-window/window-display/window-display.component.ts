import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from '../../../../services/message.service';
import { DisplayedPostComponent } from './displayed-post/displayed-post.component';
import { MessageInterface } from '../../../../shared/models/message.interface';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, switchMap } from 'rxjs';
import { ChatActiveRouterService } from '../../../../services/chat-active-router.service';
import { tap } from 'rxjs';

@Component({
  selector: 'app-window-display', // Component selector used in parent templates
  imports: [DisplayedPostComponent, CommonModule], // Imports child component to display individual messages
  templateUrl: './window-display.component.html', // External HTML template
  styleUrl: './window-display.component.scss', // SCSS styles for this component
})
export class WindowDisplayComponent {
  // // Inject MessageService to receive and manage displayed messages
  // messageService = inject(MessageService);

  // //hier is a stream of messages
  // messages$!: Observable<MessageInterface[]>;
  // private route = inject(ActivatedRoute);
  // private chatActiveRouterService = inject(ChatActiveRouterService);

  @Input() messages$!: Observable<MessageInterface[]>;

  messageInfo!: any;

  days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

  /**
   * Subscribe to the BehaviorSubject from MessageService
   * Keeps 'messages' updated with the latest conversation in real-time
   */
  ngOnInit() {
    this.messages$.subscribe((data) => {
      this.messageInfo = data;
      this.messageInfo.sort((a:any, b:any) => {
        return a.createdAt - b.createdAt;
      });
      //console.log('here are data from Window-Display', data);
      // console.log(data);
      // console.log(data[0].createdAt.toDate().setHours(0, 0, 0, 0))
      // console.log(new Date().setHours(0, 0, 0, 0))
    })
  }

  // ngOnInit() {
  //   this.messages$ = this.chatActiveRouterService.getParams$(this.route).pipe(
  //     tap((params) => console.log('PARAMS from service:', params)),
  //     switchMap(({ type, id }) => this.chatActiveRouterService.getMessages(type, id))
  //   );
  // }

  /**
 * This function compares the date, a message was created with today.
 * It returns true or false, depending on those are the same or not.
 * 
 * @param index the index of the message
 */
  messageCreatedToday(index: number) {
    let messageDate = this.messageInfo[index].createdAt.toDate().setHours(0, 0, 0, 0);
    let today = new Date().setHours(0, 0, 0, 0);
    return messageDate == today;
  }
}
