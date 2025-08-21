import { Component, Input, inject } from '@angular/core';
import { MessageInterface } from '../../../../../shared/models/message.interface';
import { AuthService } from '../../../../../services/auth.service';
import { UserService } from '../../../../../services/user.service';
import { OverlayService } from '../../../../../services/overlay.service';
import { ProfileViewOtherUsersComponent } from '../../../../../overlay/profile-view-other-users/profile-view-other-users.component';
import { map, switchMap, of } from 'rxjs';
import { Observable } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-displayed-message',
  imports: [CommonModule],

  templateUrl: './displayed-message.component.html',
  styleUrls: ['./displayed-message.component.scss'],
})
export class DisplayedMessageComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  public overlayService = inject(OverlayService);

  @Input() message!: MessageInterface;

  /** Observable für alle abhängigen Werte */
  senderName$!: Observable<string>;
  senderPhotoUrl$!: Observable<string | undefined>;
  senderIsCurrentUser$!: Observable<boolean>;
  createdAtTime$!: Observable<string>;

  ngOnChanges() {
    if (!this.message) return;

    // Prüfen, ob der Sender aktuell ist
    this.senderIsCurrentUser$ = of(
      this.message.senderId === this.authService.getCurrentUserId()
    );

    // Userdaten laden
    const user$ = this.userService.getUserById(this.message.senderId);

    this.senderName$ = user$.pipe(map((u) => u.name));
    this.senderPhotoUrl$ = user$.pipe(map((u) => u.photoUrl));

    // Zeit formatieren
    this.createdAtTime$ = of(this.message.createdAt).pipe(
      map((ts) => {
        let date: Date;
        if (ts instanceof Timestamp) {
          date = ts.toDate();
        } else {
          date = new Date(ts);
        }
        return date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      })
    );
  }

  displayProfileViewOtherUser() {
    const user$ = this.userService.getUserById(this.message.senderId);
    this.overlayService.displayOverlay(
      ProfileViewOtherUsersComponent,
      'Profil',
      {
        user$: user$,
      }
    );
  }
}
