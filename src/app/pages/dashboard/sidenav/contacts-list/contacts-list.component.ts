import { Component, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { UserService } from '../../../../services/user.service';
import { AuthService } from '../../../../services/auth.service';
import { ChatService } from '../../../../services/chat.service';
import { Observable, of, switchMap, map, combineLatest, filter } from 'rxjs';
import { UserInterface } from '../../../../shared/models/user.interface';
import { ContactListItemComponent } from './contact-list-item/contact-list-item.component';

@Component({
  selector: 'app-contacts-list',
  imports: [CommonModule, AsyncPipe, ContactListItemComponent],
  templateUrl: './contacts-list.component.html',
  styleUrls: ['./contacts-list.component.scss'],
})
export class ContactsListComponent implements OnInit {
  // Holds the list of contacts as an observable
  contacts$: Observable<UserInterface[]> = of([]);
  // // Stores the currently logged-in user's ID
  // currentUserId: string | null = null;
  // Controls visibility of direct messages section
  directMessagesVisible = true;
  currentUser!: UserInterface;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  /***
   * Lifecycle hook that runs once the component has been initialized.
   * Subscribes to the authenticated user stream and loads the user's contacts.
   */
  ngOnInit(): void {
    this.authService.currentUser$
    .pipe(filter((user): user is UserInterface => user !== null))
    .subscribe(user => this.currentUser = user);
    
    this.contacts$ = this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) {
          return of([]);
        }

        return this.chatService.getChatsForUser(user.uid).pipe(
          map((chats) =>
            chats.map((chat) =>
              this.chatService.getOtherUserId(chat.id!, user.uid)
            )
          ),
          switchMap((contactIds) => {
            if (contactIds.length === 0) return of([]);
            // combineLatest sorgt dafür, dass sich die Liste aktualisiert,
            // sobald sich bei einem Kontakt was ändert (Name, Status etc.)
            return combineLatest(
              contactIds.map((id) => this.userService.getUserById(id))
            );
          })
        );
      })
    );
  }
}
