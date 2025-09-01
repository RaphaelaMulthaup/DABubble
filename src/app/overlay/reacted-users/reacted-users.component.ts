import { Component, inject } from '@angular/core';
import { UserService } from '../../services/user.service';
import { UserInterface } from '../../shared/models/user.interface';
import { ReactionInterface } from '../../shared/models/reaction.interface';

@Component({
  selector: 'app-reacted-users',
  imports: [],
  templateUrl: './reacted-users.component.html',
  styleUrl: './reacted-users.component.scss'
})
export class ReactedUsersComponent {
  userService = inject(UserService);

  reaction!: ReactionInterface;
  userNames: string[] = [];

  ngOnInit() {
    this.reaction.users.forEach(userId => this.userService.getUserById(userId).subscribe(user => this.userNames.push(user.name)))
  }
}
