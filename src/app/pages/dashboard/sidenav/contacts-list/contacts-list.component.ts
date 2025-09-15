import { Component, inject, OnInit, WritableSignal } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { UserService } from '../../../../services/user.service';
import { AuthService } from '../../../../services/auth.service';
import { ChatService } from '../../../../services/chat.service';
import {
  Observable,
  of,
  switchMap,
  map,
  combineLatest,
  filter,
  tap,
  takeUntil,
  Subject,
  shareReplay,
} from 'rxjs';
import { UserInterface } from '../../../../shared/models/user.interface';
import { UserListItemComponent } from '../../../../shared/components/user-list-item/user-list-item.component';
import { MobileService } from '../../../../services/mobile.service';
import { MobileDashboardState } from '../../../../shared/types/mobile-dashboard-state.type';

@Component({
  selector: 'app-contacts-list',
  imports: [CommonModule, AsyncPipe, UserListItemComponent],
  templateUrl: './contacts-list.component.html',
  styleUrls: ['./contacts-list.component.scss'],
})
export class ContactsListComponent implements OnInit {
  // Holds the list of contacts as an observable
  contacts$: Observable<UserInterface[]> = of([]);
  // Controls visibility of direct messages section
  directMessagesVisible = true;
  currentUser!: UserInterface; // Stores the currently logged-in user
  mobileDashboardState: WritableSignal<MobileDashboardState>;
  private destroy$ = new Subject<void>(); // Subject used for cleanup during component destruction

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private chatService: ChatService,
    public mobileService: MobileService
  ) {
    this.mobileDashboardState = this.mobileService.mobileDashboardState; // Injects mobile dashboard state service
  }

  /***
   * Lifecycle hook that runs once the component has been initialized.
   * Subscribes to the authenticated user stream and loads the user's contacts.
   */
  ngOnInit(): void {
    // Subscribe to the current user observable from AuthService
    this.authService.currentUser$
      .pipe(
        takeUntil(this.destroy$), // Unsubscribes when the component is destroyed
        filter((user): user is UserInterface => user !== null) // Ensures user is not null
      )
      .subscribe((user) => (this.currentUser = user)); // Sets currentUser when updated

    // Load contacts based on the authenticated user's chats
    this.contacts$ = this.authService.currentUser$.pipe(
      switchMap((user) => {
        if (!user) {
          return of([]); // If no user, return an empty array
        }

        // Fetch chat data for the current user
        return this.chatService.getChatsForUser(user.uid).pipe(
          map((chats) =>
            chats.map((chat) =>
              this.chatService.getOtherUserId(chat.id!, user.uid) // Get the ID of the other user in the chat
            )
          ),
          switchMap((contactIds) => {
            if (contactIds.length === 0) return of([]); // If no contacts, return empty array
            // Get user details for each contact ID
            return combineLatest(
              contactIds.map((id) => this.userService.getUserById(id))
            );
          }),
          map((users) => users.filter((u) => u.uid !== this.currentUser.uid)) // Filter out the current user from contacts
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true }) // Share the observable to avoid duplicate requests
    );
  }

  ngOnDestroy() {
    // Cleanup logic: complete destroy subject to avoid memory leaks
    this.destroy$.next();
    this.destroy$.complete();
  }
}
