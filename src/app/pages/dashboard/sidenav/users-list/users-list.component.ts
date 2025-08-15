import { Component } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { UserInterface } from '../../../shared/models/user.interface';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-users-list',
  imports: [AsyncPipe],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss'
})
export class UsersListComponent {
  users$: Observable<UserInterface[]>;
  currentUserId: string | null = null;
  contactIds: string[] = [];

  
  constructor(private userService: UserService, private authService: AuthService){
    this.users$ = this.userService.getAllUsers();
    this.authService.user$.subscribe(user => {
      this.currentUserId = user?.uid ?? null;
      if (this.currentUserId) {
      this.userService.getUserById(this.currentUserId).subscribe(userData => {
        this.contactIds = userData.contacts || [];
      });
    }
    });
  }

  addContact(contactId:string){
    if(!this.currentUserId){
      console.warn('ID invalid:', contactId);
      return;
    }
    this.userService.addContactToUser(this.currentUserId, contactId)
    .then(() => {
      alert('Contact added successfully!');
    })
    .catch(error => {
      console.error('Error adding contact:', error);
      alert('Failed to add contact. Please try again later.');
    }
    );
  }

  removeContact(contactId: string) {
    if (!this.currentUserId) {
      console.warn('ID invalid:', contactId);
      return;
    }
    this.userService.removeContactFromUser(this.currentUserId, contactId)
      .then(() => {
        alert('Contact removed successfully!');
      })
      .catch(error => {
        console.error('Error removing contact:', error);
        alert('Failed to remove contact. Please try again later.');
      });
  }

  isAlreadyContact(contactId: string): boolean {
    return this.contactIds.includes(contactId);
  }
}
