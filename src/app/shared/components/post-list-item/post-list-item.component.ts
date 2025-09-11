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
  @Input() post!: PostInterface; // Input property to receive a post object

  constructor(
    private router: Router, // Router for navigating to different views
    private postService: PostService, // Service for handling post-related logic
    private mobileService: MobileService // Service for managing mobile dashboard state
  ) {}

  /**
   * Navigates to the conversation or thread based on post type.
   * This method handles the routing logic to navigate either to a message window or a thread window.
   */
  navigateToConversation() {
    // Determine the conversation type based on the presence of chatId or channelId
    const conversationType = this.post.chatId ? 'chat' : 'channel';
    const conversationId = this.post.chatId ?? this.post.channelId ?? 'unknown'; // Select conversation ID (chat or channel)
    const postId = this.post.id; // Get the post ID
    const parentMessageId = this.post.parentMessageId; // Get the parent message ID (if any)

    // If a post ID exists, proceed with navigation
    if (postId) {
      // Mark the post as selected in the PostService
      this.postService.select(postId);

      // If the post has an answer, navigate to the thread window with the parent message ID
      if (this.post.answer) {
        this.mobileService.setMobileDashboardState('thread-window'); // Set the mobile dashboard state for thread view
        this.router.navigate(
          [
            '/dashboard', // Base route
            conversationType, // Chat or channel type
            conversationId, // Conversation ID
            'answers', // Sub-route for answers
            parentMessageId, // Parent message ID for threading
          ],
          {
            queryParams: { scrollTo: postId }, // Scroll to the specific post
          }
        );
      } else {
        // Otherwise, navigate to the message window view
        this.mobileService.setMobileDashboardState('message-window'); // Set the mobile dashboard state for message view
        this.router.navigate(['/dashboard', conversationType, conversationId], {
          queryParams: { scrollTo: postId }, // Scroll to the specific post
        });
      }
    }
  }
}
