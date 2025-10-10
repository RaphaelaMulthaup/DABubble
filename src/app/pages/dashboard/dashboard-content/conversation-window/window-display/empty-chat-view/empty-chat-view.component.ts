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
  imports: [CommonModule], // Standalone component imports
  templateUrl: './empty-chat-view.component.html',
  styleUrl: './empty-chat-view.component.scss',
})
export class EmptyChatViewComponent {
  @Input() currentChatId!: string; // Input property to identify the current chat
  currentUserId!: string; // Stores the current logged-in user's ID
  ownChat: boolean = false; // Flag to indicate if the current chat is with the user themself
  user$!: Observable<UserInterface>; // Observable for the other user's data

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private userService: UserService,
    private overlayService: OverlayService
  ) {}

ngOnInit() {
    this.currentUserId = this.authService.getCurrentUserId()!;
    this.updateUserData(); // initialer Aufruf
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentChatId'] && !changes['currentChatId'].firstChange) {
      this.updateUserData(); // neu laden, wenn Chat-ID sich ändert
    }
  }

  private updateUserData() {
    const userId = this.chatService.getOtherUserId(this.currentChatId, this.currentUserId);
    this.user$ = this.userService.getUserById(userId);
    this.ownChat = this.currentUserId === userId;
  }

  openProfileOverlay() {
    this.overlayService.openComponent(
      ProfileViewOtherUsersComponent,
      'cdk-overlay-dark-backdrop',
      { globalPosition: 'center' },
      { user$: this.user$ }
    );
  }
}