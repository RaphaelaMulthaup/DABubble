import { Component, inject, Input } from '@angular/core';
import { PostInterface } from '../../models/post.interface';
import { Router } from '@angular/router';
import { PostService } from '../../../services/post.service';

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
  constructor(private router: Router) {}

  navigateToConversation() {
    const type = this.post.chatId ? 'chat' : 'channel';
    const channelId = this.post.chatId ?? this.post.channelId ?? 'unknown';
    const postId = this.post.id;
    if (postId) {
      this.postService.select(postId);
      if (this.post.answer) {
        this.router.navigate(
          ['/dashboard', type, channelId, 'answers', postId],
          {
            queryParams: { scrollTo: postId },
          }
        );
      } else {
        this.router.navigate(['/dashboard', type, channelId], {
          queryParams: { scrollTo: postId },
        });
      }
    }
  }
}
