import { Component, inject, Input } from '@angular/core';
import { PostInterface } from '../../models/post.interface';
import { Router } from '@angular/router';
import { PostService } from '../../../services/post.service';
import { ScreenService } from '../../../services/screen.service';

/** The data needed for navigation per route. */
interface NavigationData {
  type: 'chat' | 'channel';
  id: string;
  answerId: string;
  parentMessageId?: string;
}

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
  @Input() post!: PostInterface; // Input property to receive a post object

  constructor(
    private router: Router, // Router for navigating to different views
    private postService: PostService, // Service for handling post-related logic
    public screenService: ScreenService // Service for managing mobile dashboard state
  ) {}

  /**
   * Navigates to the selected post and passes it to postService.
   */
  navigateToConversation() {
    const postId = this.post.id;
    if (postId) {
      this.postService.select(postId);
      this.navigateToAnswerOrMessage(postId);
    }
  }

  /**
   * Navigates to the conversation or thread based on post type.
   * 
   * @param postId The ID of the selected post.
   */
  navigateToAnswerOrMessage(postId: string) {
    const conversationType = this.post.chatId ? 'chat' : 'channel';
    const conversationId = this.post.chatId ?? this.post.channelId ?? 'unknown';
    if (this.post.answer) {
      this.navigateToAnswer(conversationType, conversationId, postId);
    } else {
      this.screenService.setDashboardState('message-window');
      this.router.navigate(['/dashboard', conversationType, conversationId], {
        queryParams: { scrollTo: postId },
      });
    }
  }

  /**
   * This function passes the data needed to navigate to the answer.
   * 
   * @param conversationType The type of conversation ('chat' | 'channel') in which the answer was given.
   * @param conversationId The ID of the conversation in which the answer was given.
   * @param answerId 
   */
  navigateToAnswer(
    conversationType: 'chat' | 'channel',
    conversationId: string,
    answerId: string
  ) {
    this.navigateToAnswerByData({
      type: conversationType,
      id: conversationId,
      answerId,
      parentMessageId: this.post.parentMessageId,
    });
  }

  /**
   * Navigates to the thread of the selected answer and scrolls to the answer.
   * 
   * @param data The data needed for the route and scrolling to the answer.
   */
  private navigateToAnswerByData(data: NavigationData) {
    this.screenService.setDashboardState('thread-window');
    const route = [
      '/dashboard',
      data.type,
      data.id,
      'answers',
      data.parentMessageId,
    ];
    this.router.navigate(route, { queryParams: { scrollTo: data.answerId } });
  }
}
