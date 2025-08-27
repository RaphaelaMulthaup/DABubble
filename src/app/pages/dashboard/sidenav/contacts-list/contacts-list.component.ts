import { Component, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { UserService } from '../../../../services/user.service';
import { AuthService } from '../../../../services/auth.service';
import { ChatService } from '../../../../services/chat.service';
import { Observable, of, switchMap, map, combineLatest } from 'rxjs';
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
  // Stores the currently logged-in user's ID
  currentUserId: string | null = null;
  // Controls visibility of direct messages section
  directMessagesVisible = true;

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
    // Wait for the logged-in user
    this.authService.user$.subscribe((user) => {
      if (!user) {
        // If there is no logged-in user, reset state
        this.currentUserId = null;
        this.contacts$ = of([]);
        return;
      }

      this.currentUserId = user.uid;

      // Load contacts for the current user
      this.contacts$ = this.chatService
        .getChatsForUser(this.currentUserId)
        .pipe(
          // Extract the IDs of the other users in each chat
          map((chats) =>
            chats.map((chat) =>
              this.chatService.getOtherUserId(chat.id!, this.currentUserId!)
            )
          ),
          // For each contact ID, fetch the full user details
          switchMap((contactIds) => {
            console.log(contactIds);

            if (contactIds.length === 0) return of([]);
            // Combine all user detail observables into one stream
            return combineLatest(
              contactIds.map((id) => this.userService.getUserById(id))
            );
          })
        );
    });
  }
}
