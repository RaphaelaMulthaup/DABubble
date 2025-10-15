import { Component, effect, Input, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserInterface } from '../../models/user.interface';
import { OverlayService } from '../../../services/overlay.service';
import { OverlayRef } from '@angular/cdk/overlay';

@Component({
  selector: 'app-user-list-item-to-channel',
  imports: [CommonModule],
  templateUrl: './user-list-item-to-channel.component.html',
  styleUrls: [
    './user-list-item-to-channel.component.scss',
    './../../styles/list-item.scss',
  ],
})
export class UserListItemToChannelComponent {
  @Input() results!: Signal<UserInterface[]>;
  @Input() overlayRef!: OverlayRef;
  @Input() onBottom: boolean = false;
  overlay: string = '';
  users: UserInterface[] = [];

  constructor(private overlayService: OverlayService) {
    effect(() => {
      this.users = this.results();
    });
  }

  /**
   * Adds a user to the current channel if they are not already present.
   * If the user is added, it triggers a reset of the overlay state and closes the associated overlay.
   *
   * @param user - The user object to add to the channel.
   */
  addUserToChannel(user: UserInterface) {
    const currentUsers = this.overlayService.users();
    const exists = currentUsers.some((u) => u.name === user.name);
    if (exists) {
      return;
    } else {
      this.overlayService.addUser(user);
      this.overlayService.triggerReset();
      this.overlayRef.dispose();
      this.overlayService.closeOne(this.overlayRef);
    }
  }
}
