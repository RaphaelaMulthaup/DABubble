import { Component, inject, OnInit, WritableSignal } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { UserService } from '../../../../services/user.service';
import { AuthService } from '../../../../services/auth.service';
import { ChatService } from '../../../../services/chat.service';
import { Observable, of, switchMap, map, combineLatest, filter } from 'rxjs';
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
  // // Stores the currently logged-in user's ID
  // currentUserId: string | null = null;
  // Controls visibility of direct messages section
  directMessagesVisible = true;
  currentUser!: UserInterface;

  public mobileService = inject(MobileService);

  mobileDashboardState: WritableSignal<MobileDashboardState> = this.mobileService.mobileDashboardState;

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
      .subscribe((user) => (this.currentUser = user));

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
            return combineLatest(
              contactIds.map((id) => this.userService.getUserById(id))
            );
          }),
          map((users) => users.filter((u) => u.uid !== this.currentUser.uid)) // 🔑 Filter raus
        );
      })
    );
  }
}
