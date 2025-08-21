import { AsyncPipe } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { User } from '@angular/fire/auth';
import { combineLatest, Observable } from 'rxjs';
import { UserInterface } from '../../shared/models/user.interface';
import { OverlayService } from '../../services/overlay.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-profile-view-other-users',
  imports: [AsyncPipe],
  templateUrl: './profile-view-other-users.component.html',
  styleUrl: './profile-view-other-users.component.scss',
})
export class ProfileViewOtherUsersComponent {
  overlayService = inject(OverlayService);
  authService = inject(AuthService);
  userService = inject(UserService);

  user$ = this.overlayService.overlayInputs[
    'user$'
  ] as Observable<UserInterface>;

  openChat() {
    //   let currentUserId: string = this.authService.getCurrentUserId()!;
    //   let currendUser$ = this.userService.getUserById(currentUserId);
    // combineLatest([currendUser$, this.user$]).subscribe(
    //   ([currentUser, otherUser]) => {
    //     if (!currentUser) {
    //       console.warn('No current user logged in');
    //       return;
    //     }
    //     if (!otherUser) {
    //       console.warn('Other user not loaded');
    //       return;
    //     }
    //     console.log('Current User:', currentUser);
    //     console.log('Other User:', otherUser);
    //     // Prüfen, ob otherUser.uid in den Kontakten ist
    //     const isContact = !!currentUser.contacts &&
    //       Object.values(currentUser.contacts).some(
    //         contact => contact.userId === otherUser.uid
    //       );
    //     console.log('Is Other User a contact?', isContact);
    //   }
    // );
  }
}
