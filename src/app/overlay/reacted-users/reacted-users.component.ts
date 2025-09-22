import { Component, inject } from '@angular/core';
import { UserService } from '../../services/user.service';
import { UserInterface } from '../../shared/models/user.interface';
import { ReactionInterface } from '../../shared/models/reaction.interface';
import { AuthService } from '../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-reacted-users',
  imports: [],
  templateUrl: './reacted-users.component.html',
  styleUrl: './reacted-users.component.scss',
})
export class ReactedUsersComponent {
  reaction!: ReactionInterface;
  userNames: string[] = [];
  currentUserReacted: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const currentUserId = this.authService.currentUser?.uid ?? null;
    if (currentUserId) {
      this.currentUserReacted = this.reaction.users.includes(currentUserId);
      if (this.currentUserReacted) {
        this.userService
          .getUserById(currentUserId)
          .pipe(takeUntil(this.destroy$))
          .subscribe((user) => this.userNames.push(user.name));
      }
    }
    let otherUserIds = this.reaction.users.filter((id) => id !== currentUserId);
    otherUserIds.forEach((userId) =>
      this.userService
        .getUserById(userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe((user) => this.userNames.push(user.name))
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
