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
  firstValueFrom,
} from 'rxjs';
import { UserInterface } from '../../../../shared/models/user.interface';
import { UserListItemComponent } from '../../../../shared/components/user-list-item/user-list-item.component';
import { MobileDashboardState } from '../../../../shared/types/mobile-dashboard-state.type';
import { ScreenService } from '../../../../services/screen.service';

@Component({
  selector: 'app-contacts-list',
  imports: [CommonModule, AsyncPipe, UserListItemComponent],
  templateUrl: './contacts-list.component.html',
  styleUrls: ['./contacts-list.component.scss'],
})
export class ContactsListComponent implements OnInit {
  contacts$: Observable<UserInterface[]> = of([]); // Observable holding list of contacts
  directMessagesVisible = true; // UI flag for showing/hiding direct messages
  currentUser$!: Observable<UserInterface | null>; // Observable of the current logged-in user
  currentUser!: UserInterface; // hier speichern wir den User

  mobileDashboardState!: WritableSignal<MobileDashboardState>; // Signal to track mobile dashboard state
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private chatService: ChatService,
    public screenService: ScreenService
  ) {
    // Subscribe to current user observable from AuthService
    this.currentUser$ = this.authService.currentUser$;
    // Initialize mobile dashboard state signal
    this.mobileDashboardState = this.screenService.mobileDashboardState;
  }

  /*** Initialize contacts observable on component init ***/
  async ngOnInit() {
    let currentUser = await firstValueFrom(this.authService.currentUser$);
    if (currentUser) {
      this.currentUser = currentUser;
    }
    this.contacts$ = this.authService.currentUser$.pipe(
      filter((user): user is UserInterface => !!user), // Only proceed if user exists
      switchMap((user) =>
        this.chatService.getChatsForUser(user.uid).pipe(
          // Get all chat objects for the current user
          map((chats) =>
            chats.map(
              (chat) => this.chatService.getOtherUserId(chat.id!, user.uid) // Get the ID of the other user in the chat
            )
          ),
          switchMap((contactIds) => {
            if (contactIds.length === 0) return of([]); // If no contacts, return empty array
            // Get user details for each contact ID
            return combineLatest(
              contactIds.map((id) => this.userService.getUserById(id))
            );
          }),
          // Remove current user from the contact list just in case
          map((users) => users.filter((u) =>  u && u.uid !== user.uid))
        )
      ),
      shareReplay({ bufferSize: 1, refCount: true }) // Cache latest contacts for new subscribers
    );
  }
}
