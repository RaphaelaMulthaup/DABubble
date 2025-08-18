import { Component, inject, Input } from '@angular/core';
import { MessageInterface } from '../../../../../shared/models/message.interface';
import { AuthService } from '../../../../../services/auth.service';
import { UserInterface } from '../../../../../shared/models/user.interface';
import { UserService } from '../../../../../services/user.service';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-displayed-message',
  imports: [],
  templateUrl: './displayed-message.component.html',
  styleUrl: './displayed-message.component.scss',
})
export class DisplayedMessageComponent {
  // Inject AuthService instance to handle authentication
  private authService = inject(AuthService);
  private userService = inject(UserService);

  @Input() message!: MessageInterface;
  senderId!: string;
  senderPhotoUrl?: string;
  senderName!: string;
  senderIsCurrentUser!: boolean;
  createdAtTime!: string;

  ngOnInit() {
    this.senderId = this.message.senderId;
    this.checkIfSenderIsCurrentUser();
    this.loadSenderInfo();
    this.formatCreatedAt();
  }

  checkIfSenderIsCurrentUser() {
    if (this.message && this.senderId == this.authService.getCurrentUserId()) {
      this.senderIsCurrentUser = true;
    }
  }

  loadSenderInfo() {
    this.userService.getUserById(this.senderId).subscribe({
      next: (user) => {
        this.senderPhotoUrl = user.photoUrl;
        this.senderName = user.name;
      },
      error: (err) => {
        console.error('Fehler beim Laden des Users', err);
      },
    });
  }

  formatCreatedAt() {
    if (this.message?.createdAt) {
      let date: Date;

      if (this.message.createdAt instanceof Timestamp) {
        // Firestore Timestamp → JS Date
        date = this.message.createdAt.toDate();
      } else {
        // Fallback (falls schon Date oder number übergeben wird)
        date = new Date(this.message.createdAt);
      }

      this.createdAtTime = date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }
}
