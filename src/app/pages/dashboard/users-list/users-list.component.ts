import { Component, inject } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { UserInterface } from '../../../shared/models/user.interface';
import { AsyncPipe } from '@angular/common';
import { doc, Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-users-list',
  imports: [AsyncPipe],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
})
export class UsersListComponent {
  users$: Observable<UserInterface[]>;
  currentUserId: string | null = null;
  contactIds: string[] = [];
  contacts: { [contactId: string]: { userId: string; chatId: string } } = {};
    private firestore: Firestore = inject(Firestore);


  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {
    this.users$ = this.userService.getAllUsers();
    this.authService.user$.subscribe((user) => {
      this.currentUserId = user?.uid ?? null;
      if (this.currentUserId) {
        this.userService
          .getUserById(this.currentUserId)
          .subscribe((userData) => {
            this.contacts = userData.contacts || {};
            this.contactIds = Object.keys(this.contacts); // nur IDs extrahieren
          });
      }
    });
  }

  addContact(contactId: string) {
    if (!this.currentUserId) return;

    const newContact = {
      userId: contactId,
      chatId: this.generateChatId(), // oder wie auch immer du ihn erzeugst
    };

    this.userService
      .addContactToUser(this.currentUserId, contactId, newContact)
      .then(() => alert('Contact added successfully!'))
      .catch((error) => console.error(error));
  }

private generateChatId(): string {
  // Dummy-Dokument-Referenz nutzen, um eine eindeutige ID zu bekommen
  return doc(this.firestore, 'dummy', crypto.randomUUID()).id;
}
  removeContact(contactId: string) {
    if (!this.currentUserId) return;

    this.userService
      .removeContactFromUser(this.currentUserId, contactId)
      .then(() => alert('Contact removed successfully!'))
      .catch((error) => console.error(error));
  }

  isAlreadyContact(contactId: string): boolean {
    return contactId in this.contacts;
  }
}
