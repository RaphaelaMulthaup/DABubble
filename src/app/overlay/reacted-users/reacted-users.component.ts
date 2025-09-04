import { Component, inject } from '@angular/core';
import { UserService } from '../../services/user.service';
import { UserInterface } from '../../shared/models/user.interface';
import { ReactionInterface } from '../../shared/models/reaction.interface';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reacted-users',
  imports: [],
  templateUrl: './reacted-users.component.html',
  styleUrl: './reacted-users.component.scss'
})
export class ReactedUsersComponent {
  userService = inject(UserService);
  authService = inject(AuthService);

  reaction!: ReactionInterface;
  userNames: string[] = [];
  currentUserReacted:boolean = false;

  ngOnInit() {
    const currentUserId = this.authService.currentUser.uid!;
    this.currentUserReacted = this.reaction.users.includes(currentUserId);

    if (this.currentUserReacted) {
      this.userService.getUserById(currentUserId).subscribe(user => this.userNames.push(user.name))
    }

    let otherUserIds = this.reaction.users.filter(id => id !== currentUserId);
    otherUserIds.forEach(userId => this.userService.getUserById(userId).subscribe(user => this.userNames.push(user.name)))
  }
}
