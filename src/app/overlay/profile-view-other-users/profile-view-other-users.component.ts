import { AsyncPipe } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { UserInterface } from '../../shared/models/user.interface';
import { OverlayService } from '../../services/overlay.service';

@Component({
  selector: 'app-profile-view-other-users',
  imports: [AsyncPipe],
  templateUrl: './profile-view-other-users.component.html',
  styleUrl: './profile-view-other-users.component.scss',
})
export class ProfileViewOtherUsersComponent {
  overlayService = inject(OverlayService);

  user$ = this.overlayService.overlayInputs[
    'user$'
  ] as Observable<UserInterface>;
}
