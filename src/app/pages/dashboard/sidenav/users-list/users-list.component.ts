import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../services/user.service';
import { AuthService } from '../../../../services/auth.service';
import { Observable } from 'rxjs';
import { UserInterface } from '../../../../shared/models/user.interface';
import { AsyncPipe } from '@angular/common';
import { doc, Firestore } from '@angular/fire/firestore';
import { ContactListItemComponent } from './contact-list-item/contact-list-item.component';

@Component({
  selector: 'app-users-list',
  imports: [CommonModule, AsyncPipe, ContactListItemComponent],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
})
export class UsersListComponent {
  // Observable containing the list of all users  //Das dürfen dann später nur die Kontakte des Currentusers sein
  users$: Observable<UserInterface[]>;

  // ID of the currently logged-in user
  currentUserId: string | null = null;

  // Array of contact IDs for the current user
  contactIds: string[] = [];

  // Object containing the contacts with userId and chatId for each contact
  contacts: { [contactId: string]: { userId: string; chatId: string } } = {};

  directMessagesVisible: boolean = true;

  // Firestore instance
  private firestore: Firestore = inject(Firestore);

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {
    // Fetch all users //Das dürfen dann später nur die Kontakte des Currentusers sein
    this.users$ = this.userService.getAllUsers();

    // Subscribe to the current authenticated user
    this.authService.user$.subscribe((user) => {
      this.currentUserId = user?.uid ?? null;
      if (this.currentUserId) {
        // Fetch current user's contact list
        this.userService
          .getUserById(this.currentUserId)
          .subscribe((userData) => {
            this.contacts = userData.contacts || {};
            this.contactIds = Object.keys(this.contacts); // Extract only the IDs
          });
      }
    });
  }

  /**
   * Adds a new contact to the current user's contact list
   * @param contactId ID of the user to add as a contact
   */
  addContact(contactId: string) {
    if (!this.currentUserId) return;

    const newContact = {
      userId: contactId,
      chatId: this.generateChatId(), // Generate a unique chat ID
    };

    this.userService
      .addContactToUser(this.currentUserId, contactId, newContact)
      .then(() => alert('Contact added successfully!'))
      .catch((error) => console.error(error));
  }

  /**
   * Generates a unique chat ID using a dummy Firestore document reference
   * @returns a unique chat ID
   */
  private generateChatId(): string {
    return doc(this.firestore, 'dummy', crypto.randomUUID()).id;
  }

  /**
   * Removes a contact from the current user's contact list
   * @param contactId ID of the contact to remove
   */
  removeContact(contactId: string) {
    if (!this.currentUserId) return;

    this.userService
      .removeContactFromUser(this.currentUserId, contactId)
      .then(() => alert('Contact removed successfully!'))
      .catch((error) => console.error(error));
  }

  /**
   * Checks if a given user is already a contact
   * @param contactId ID of the user to check
   * @returns true if the user is already a contact, false otherwise
   */
  isAlreadyContact(contactId: string): boolean {
    return contactId in this.contacts;
  }
}
