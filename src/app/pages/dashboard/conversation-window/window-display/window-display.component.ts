import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from '../../../../services/message.service';
import { DisplayedPostComponent } from './displayed-post/displayed-post.component';
import { MessageInterface } from '../../../../shared/models/message.interface';
import { ActivatedRoute, RouterLink } from '@angular/router';
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

  //an array with all posts in this conversation
  postInfo!: any[];

  //an array with all the days of the week, to show that one a post was created
  days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  /**
   * Subscribe to the BehaviorSubject from MessageService
   * Keeps 'messages' updated with the latest conversation in real-time
   */
  ngOnInit() {
    this.messages$.subscribe((data) => {
      this.postInfo = data;
      this.postInfo.sort((a: any, b: any) => {
        return a.createdAt - b.createdAt;
      });
    })
  }

  // ngOnInit() {
  //   this.messages$ = this.chatActiveRouterService.getParams$(this.route).pipe(
  //     tap((params) => console.log('PARAMS from service:', params)),
  //     switchMap(({ type, id }) => this.chatActiveRouterService.getMessages(type, id))
  //   );
  // }

  /**
* This function returns true when the creation-date of a post is not equal to the creation-date of the previous post.
* This way, the creation-date is only shown, when a message is the first one with that creation-date.
* 
* @param index the index of the post
*/
  shouldShowDate(index: number): boolean {
    if (index > 0) {
      let currentPostDate = this.postInfo[index].createdAt.toDate().toISOString().split('T')[0];
      let previousPostDate = this.postInfo[(index - 1)].createdAt.toDate().toISOString().split('T')[0];
      return currentPostDate !== previousPostDate;
    }
    return true;
  }

  /**
 * This function compares the date, a post was created with today.
 * It returns true or false, depending on those are the same or not.
 * 
 * @param index the index of the post
 */
  postCreatedToday(index: number): boolean {
    let postDate = this.postInfo[index].createdAt.toDate().setHours(0, 0, 0, 0);
    let today = new Date().setHours(0, 0, 0, 0);
    return postDate == today;
  }
}
