import { AsyncPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { UserInterface } from '../../shared/models/user.interface';

@Component({
  selector: 'app-profile-view-other-users',
  imports: [AsyncPipe],
  templateUrl: './profile-view-other-users.component.html',
  styleUrl: './profile-view-other-users.component.scss',
})
export class ProfileViewOtherUsersComponent {
  @Input() user$!: Observable<UserInterface>;
}
