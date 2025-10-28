import { Component, Input } from '@angular/core';
import { NavigationData } from '../../models/navigation.data.interface';
import { PostInterface } from '../../models/post.interface';
import { Router } from '@angular/router';
import { PostService } from '../../../services/post.service';
import { ScreenService } from '../../../services/screen.service';
import { ConversationActiveRouterService } from '../../../services/conversation-active-router.service';
import { ChatService } from '../../../services/chat.service';
import { AuthService } from '../../../services/auth.service';

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

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private conversationActiveRouterService: ConversationActiveRouterService,
    private router: Router,
    public postService: PostService,
    public screenService: ScreenService
  ) {}

  /**
   * Navigates to the selected post and passes it to postService.
   */
  navigateToConversation() {
    const postId = this.post.id;
    if (postId) {
      this.postService.select(postId);
      this.navigateToAnswerOrMessage(postId);
      this.setActiveConversationSidenav();
    }
  }

  /**
   * Navigates to the conversation or thread based on post type.
   *
   * @param postId - The ID of the selected post
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
   * Sets the currentConversation to the navigated chat- or channel-id.
   */
  setActiveConversationSidenav() {
    let conversationId: string;
    if (this.post.chatId) {
      conversationId = this.chatService.getOtherUserId(this.post.chatId, this.authService.currentUser!.uid);
    } else conversationId = this.post.channelId!;
    this.conversationActiveRouterService.currentConversation.set(conversationId);
  }

  /**
   * This function passes the data needed to navigate to the answer.
   *
   * @param conversationType - The type of conversation ('chat' | 'channel') in which the answer was given
   * @param conversationId - The ID of the conversation in which the answer was given
   * @param answerId - The ID of the answer to navigate to
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
   * @param data - The data needed for the route and scrolling to the answer.
   */
  navigateToAnswerByData(data: NavigationData) {
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
