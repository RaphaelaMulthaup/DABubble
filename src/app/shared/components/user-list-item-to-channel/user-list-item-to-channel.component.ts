import { Component, effect,  Input, Signal } from '@angular/core';
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
  @Input() onBottom:boolean = false;

  overlay: string = '';
  users: UserInterface[] = [];

  constructor(private overlayService: OverlayService) {
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
      this.overlayService.closeOne(this.overlayRef);
    }
  }
}
