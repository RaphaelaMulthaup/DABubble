import { Component } from '@angular/core';
import { UserListItemComponent } from '../../../../../shared/components/user-list-item/user-list-item.component';
import { Observable } from 'rxjs';
import { ChatService } from '../../../../../services/chat.service';
import { UserInterface } from '../../../../../shared/models/user.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header-chat',
  imports: [UserListItemComponent, CommonModule],
  templateUrl: './header-chat.component.html',
  styleUrl: './header-chat.component.scss',
})
export class HeaderChatComponent {
  otherUser$!: Observable<UserInterface | null>;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.otherUser$ = this.chatService.otherUser$;
  }
}
