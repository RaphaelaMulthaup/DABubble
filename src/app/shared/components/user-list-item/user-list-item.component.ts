import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserInterface } from '../../models/user.interface'; // Importing the UserInterface for type safety
import { AuthService } from '../../../services/auth.service'; // Importing AuthService to get the current logged-in user's data
import { ChatService } from '../../../services/chat.service'; // Importing ChatService to handle chat-related operations
import { OverlayService } from '../../../services/overlay.service'; // Importing OverlayService for managing overlays like profiles
import { CommonModule } from '@angular/common'; // Importing CommonModule for basic Angular functionality
import { of, Subscription } from 'rxjs'; // Importing `of` to create observables from static values
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-user-list-item', // Component selector used in parent templates
  imports: [CommonModule], // Necessary imports for common Angular functionalities
  templateUrl: './user-list-item.component.html', // The component's template
  styleUrls: [
    './user-list-item.component.scss', // Component-specific styles
    './../../styles/list-item.scss', // Shared list item styles
  ],
})
export class UserListItemComponent {
  /**
   * Input property that receives a user object from the parent component.
   * This is used to display information about a specific user.
   */
  @Input() user!: UserInterface;

  /** Flag to indicate if this user is related to a search result post */
  @Input() relatedToSearchResultPost: boolean = false;

  /** Flag to indicate if this component is part of search results in the current post input */
  @Input() isInSearchResultsCurrentPostInput: boolean = false;

  /** Flag to indicate whether this component should perform no action */
  @Input() doNothing: boolean = false;

  /** Flag to control whether to show the profile overlay */
  @Input() showProfile: boolean = false;

  /** Flag to indicate if this item is part of a header in the chat */
  @Input() inHeaderChat: boolean = false;

  /** EventEmitter to notify the parent component when a user is selected */
  @Output() userSelected = new EventEmitter<UserInterface>();

  /** Stores the ID of the currently logged-in user */
  currentUserId: string | null = null;
  private sub?: Subscription;
  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private userService: UserService
  ) {}
  ngOnInit() {
    this.sub = this.authService.currentUser$.subscribe((user) => {
      this.currentUserId = user?.uid ?? null;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  /**
   * Finds a chat between the current user and a selected user,
   * then navigates to it if it exists.
   *
   * This function checks if the user is logged in and uses the ChatService to navigate to the chat.
   */
  async pickOutAndNavigateToChat() {
    if (!this.currentUserId) return; // If the user is not logged in, do nothing
    // Navigates to the chat between the current user and the selected user
    this.chatService.navigateToChat(this.currentUserId, this.user);
  }

  /**
   * Decides whether to navigate to the chat or show the profile overlay based on certain conditions.
   * It checks if the current user is logged in and whether specific flags are set.
   */
  async choiceBetweenNavigateAndProfile() {
    if (!this.currentUserId || this.doNothing) return; // If no user is logged in or if the 'doNothing' flag is true, do nothing
    if (this.isInSearchResultsCurrentPostInput) {
      // If this item is part of the search results, emit the selected user
      this.userSelected.emit(this.user);
    } else if (this.showProfile || this.inHeaderChat) {
      // If the 'showProfile' flag is set or if it's in the header chat, show the profile overlay
      this.userService.openProfileOverlay(this.user.uid, this.currentUserId);
    } else {
      // Otherwise, navigate to the chat
      this.pickOutAndNavigateToChat();
    }
  }
}
