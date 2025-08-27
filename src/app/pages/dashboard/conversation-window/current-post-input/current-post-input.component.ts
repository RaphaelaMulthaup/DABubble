import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { ChatActiveRouterService } from '../../../../services/chat-active-router.service';
import { MessageService } from '../../../../services/message.service';

@Component({
  selector: 'app-current-post-input',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './current-post-input.component.html',
  styleUrl: './current-post-input.component.scss',
})
export class CurrentPostInput {
  /** Type of the current conversation (e.g. "chat" or "channel"). */
  type!: string;

  /** ID of the current conversation (chat or channel). */
  conversationId!: string;

  /** If replying, holds the ID of the message being replied to; otherwise null. */
  messageToReplyId: string | null = null;

  /** Provides methods to create messages and replies. */
  private messageService = inject(MessageService);

  /** Provides information about the currently logged-in user. */
  private authService = inject(AuthService);

  /** Gives access to the current route parameters. */
  private route = inject(ActivatedRoute);

  /** Provides helper methods for extracting conversation and message IDs from the route. */
  private chatActiveRouterService = inject(ChatActiveRouterService);

  /** Stores any error message to be displayed in the input form. */
  errorMessage: string | null = null;

  /** Reactive form for creating a new message or reply. */
  postForm: FormGroup = new FormGroup({
    /** Input field for the message text. */
    text: new FormControl('', []),
  });

  /**
   * Angular lifecycle hook that runs after the component is initialized.
   * Subscribes to the route parameters (type, conversationId, messageId) via ChatActiveRouterService
   * and updates local state accordingly.
   */
  ngOnInit() {
    this.chatActiveRouterService.getType$(this.route).subscribe((t) => {
      this.type = t;
      console.log(`aici trebuie tip  |  ${this.type} `);
    });
    this.chatActiveRouterService.getId$(this.route).subscribe((id) => {
      this.conversationId = id;
      console.log(`aici channelid    | ${this.conversationId}`);
    });
    this.chatActiveRouterService.getMessageId$(this.route).subscribe((msgId) => {
      this.messageToReplyId = msgId;
      console.log(` aici messageid    |  ${this.messageToReplyId}`);
    });
  }

  /**
   * Handles form submission:
   * - Retrieves the entered message text.
   * - Checks if the user is replying to an existing message or creating a new one.
   * - Calls MessageService accordingly.
   * - Resets the form afterwards.
   */
  onSubmit() {
    const post = this.postForm.get('text')?.value;
    const currentUserId: string | null = this.authService.getCurrentUserId();

    if (this.messageToReplyId) {
      this.messageService.createAnswer(
        this.conversationId,
        this.messageToReplyId,
        currentUserId!,
        post,
        this.type
      );
    } else {
      this.messageService.createMessage(
        this.conversationId,
        currentUserId!,
        post,
        this.type
      );
    }
    this.postForm.reset();
  }
}
