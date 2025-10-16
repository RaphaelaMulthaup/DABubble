import { Component, OnInit, WritableSignal } from '@angular/core';
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
  shareReplay,
  firstValueFrom,
} from 'rxjs';
import { UserInterface } from '../../../../shared/models/user.interface';
import { UserListItemComponent } from '../../../../shared/components/user-list-item/user-list-item.component';
import { DashboardState } from '../../../../shared/types/dashboard-state.type';
import { ScreenService } from '../../../../services/screen.service';
import { ConversationActiveRouterService } from '../../../../services/conversation-active-router.service';

@Component({
  selector: 'app-contacts-list',
  imports: [CommonModule, AsyncPipe, UserListItemComponent],
  templateUrl: './contacts-list.component.html',
  styleUrls: ['./contacts-list.component.scss'],
})
export class ContactsListComponent implements OnInit {
  contacts$: Observable<UserInterface[]> = of([]);
  dashboardState!: WritableSignal<DashboardState>;
  currentUser$!: Observable<UserInterface | null>;
  currentUser!: UserInterface;
  directMessagesVisible: boolean = true;

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    public conversationActiveRouterService: ConversationActiveRouterService,
    public screenService: ScreenService,
    private userService: UserService
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.dashboardState = this.screenService.dashboardState;
  }

  async ngOnInit() {
    this.currentUser = await this.getCurrentUser();
    this.contacts$ = this.getContactsForUser();
  }

  /**
   * Gets the currently authenticated user once
   */
  async getCurrentUser(): Promise<UserInterface> {
    const user = await firstValueFrom(this.authService.currentUser$);
    if (!user) throw new Error('No current user found');
    return user;
  }

  /**
   * Builds an observable of all contact users for the current user
   */
  getContactsForUser(): Observable<UserInterface[]> {
    return this.currentUser$.pipe(
      filter((user): user is UserInterface => !!user),
      switchMap((user) => this.loadContactsForUser(user)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Loads all contact-users data for the given user.
   * 
   * @param user - the current user, for whom the contacts are fetched
   */
  loadContactsForUser(user: UserInterface): Observable<UserInterface[]> {
    return this.chatService.getChatsForUser(user.uid).pipe(
      map((chats) => chats.map((chat) => this.chatService.getOtherUserId(chat.id!, user.uid))),
      switchMap((contactIds) =>
        contactIds.length === 0
          ? of([])
          : combineLatest(contactIds.map((id) => this.userService.getUserById(id)))
      ),
      map((users) => users.filter((u) => u && u.uid !== user.uid))
    );
  }
}