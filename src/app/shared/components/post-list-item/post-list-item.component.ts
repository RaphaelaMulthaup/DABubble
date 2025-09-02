import { Component, Input } from '@angular/core';
import { PostInterface } from '../../models/post.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-post-list-item',
  imports: [],
  templateUrl: './post-list-item.component.html',
  styleUrls: [
    './post-list-item.component.scss',
    '../../../shared/styles/list-item.scss',
  ],
})
export class PostListItemComponent {
  @Input() post!: PostInterface;
  constructor(private router: Router) {}

  navigateToConversation() {
    const type = this.post.chatId ? 'chat' : 'channel';
    const channelId = this.post.chatId ?? this.post.channelId ?? 'unknown';

    if (this.post.answer) {
      this.router.navigate([
        '/dashboard',
        type,
        channelId,
        'answers',
        this.post.id,
      ]);
    } else {
      this.router.navigate(['/dashboard', type, channelId]);
    }
  }
}
