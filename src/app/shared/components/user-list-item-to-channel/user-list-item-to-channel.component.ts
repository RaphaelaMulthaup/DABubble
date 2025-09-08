import { Component, effect, inject, Input, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { UserInterface } from '../../models/user.interface';
import { OverlayService } from '../../../services/overlay.service';
import { OverlayRef } from '@angular/cdk/overlay';

@Component({
  selector: 'app-user-list-item-to-channel',
  imports: [],
  templateUrl: './user-list-item-to-channel.component.html',

  styleUrls: [
    './user-list-item-to-channel.component.scss',
    './../../styles/list-item.scss',
  ],
})
export class UserListItemToChannelComponent {
  @Input() results!: Signal<UserInterface[]>;
  @Input() overlayRef!: OverlayRef;

  private overlayService = inject(OverlayService);
  overlay: string = '';

  users: UserInterface[] = [];

  constructor() {
    effect(() => {
      this.users = this.results(); // automat actualizat când signal-ul se schimbă
    });
  }

  addMemberToArray(user: UserInterface) {
    const currentUsers = this.overlayService.users();
    const exists = currentUsers.some((u) => u.name === user.name);
    if (exists) {
      return;
    } else {
      this.overlayService.addUser(user); // actualizezi signal-ul
      this.overlayService.triggerReset();
      this.overlayRef.dispose();
    }
  }
}
