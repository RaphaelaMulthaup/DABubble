import { Component, Input, SimpleChanges } from '@angular/core';
import { ChatService } from '../../../../../../services/chat.service';
import { AuthService } from '../../../../../../services/auth.service';
import { UserInterface } from '../../../../../../shared/models/user.interface';
import { Observable } from 'rxjs';
import { UserService } from '../../../../../../services/user.service';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../../../../../services/overlay.service';
import { ProfileViewOtherUsersComponent } from '../../../../../../overlay/profile-view-other-users/profile-view-other-users.component';

@Component({
  selector: 'app-empty-chat-view',
  imports: [CommonModule],
  templateUrl: './empty-chat-view.component.html',
  styleUrl: './empty-chat-view.component.scss',
})
export class EmptyChatViewComponent {
  @Input() currentChatId!: string;
  user$!: Observable<UserInterface>;
  ownChat: boolean = false;
  currentUserId!: string;

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private overlayService: OverlayService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.currentUserId = this.authService.getCurrentUserId()!;
    this.updateUserData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentChatId'] && !changes['currentChatId'].firstChange)
      this.updateUserData();
  }

  /**
   * Loads the data of the other user in the current chat and updates the local state.
   * Sets `user$` to an observable of the other user's data and `ownChat` to true if the current user is the other user.
   */
  updateUserData() {
    const userId = this.chatService.getOtherUserId(
      this.currentChatId,
      this.currentUserId
    );
    this.user$ = this.userService.getUserById(userId);
    this.ownChat = this.currentUserId === userId;
  }

  /**
   * This function opens the ProfileViewOtherUsers-Overlay.
   */
  openProfileViewOtherUsersOverlay() {
    this.overlayService.openComponent(
      ProfileViewOtherUsersComponent,
      'cdk-overlay-dark-backdrop',
      { globalPosition: 'center' },
      { user$: this.user$ }
    );
  }
}
