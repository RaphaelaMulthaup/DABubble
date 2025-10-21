import { Component } from '@angular/core';
import { UserListItemComponent } from '../../../../../../shared/components/user-list-item/user-list-item.component';
import { Observable } from 'rxjs';
import { ChatService } from '../../../../../../services/chat.service';
import { UserInterface } from '../../../../../../shared/models/user.interface';
import { CommonModule } from '@angular/common';
import { ScreenService } from '../../../../../../services/screen.service';
import { ScreenSize } from '../../../../../../shared/types/screen-size.type';

@Component({
  selector: 'app-header-chat',
  imports: [UserListItemComponent, CommonModule],
  templateUrl: './header-chat.component.html',
  styleUrl: './header-chat.component.scss',
})
export class HeaderChatComponent {
  otherUser$!: Observable<UserInterface | null>;
  screenSize$!: Observable<ScreenSize>;

  constructor(
    private chatService: ChatService,
    private screenService: ScreenService
  ) {
    this.screenSize$ = this.screenService.screenSize$;
  }

  ngOnInit() {
    this.otherUser$ = this.chatService.otherUser$;
  }
}
