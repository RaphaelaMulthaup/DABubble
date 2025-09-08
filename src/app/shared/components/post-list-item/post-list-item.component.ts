import { Component, inject, Input } from '@angular/core';
import { PostInterface } from '../../models/post.interface';
import { Router } from '@angular/router';
import { PostService } from '../../../services/post.service';
import { MobileService } from '../../../services/mobile.service';

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
  postService = inject(PostService);
  mobileService = inject(MobileService);
  constructor(private router: Router) {}

  navigateToConversation() {
    const conversationType = this.post.chatId ? 'chat' : 'channel';
    const conversationId = this.post.chatId ?? this.post.channelId ?? 'unknown';
    const postId = this.post.id;
    const parentMessageId = this.post.parentMessageId;
    if (postId) {
      this.postService.select(postId);
      if (this.post.answer) {
        this.mobileService.setMobileDashboardState('thread-window');
        this.router.navigate(
          ['/dashboard', conversationType, conversationId, 'answers', parentMessageId],
          {
            queryParams: { scrollTo: postId },
          }
        );
      } else {
        this.router.navigate(['/dashboard', conversationType, conversationId], {
          queryParams: { scrollTo: postId },
        });
      }
    }
  }
}
