import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ThreadService } from '../../../../services/thread.service';
import { ChannelSelectionService } from '../../../../services/channel-selection.service';
import { AuthService } from '../../../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { ChatActiveRouterService } from '../../../../services/chat-active-router.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-current-message-input',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './current-message-input.component.html',
  styleUrl: './current-message-input.component.scss',
})
export class CurrentMessageInput {

  type!: string;
  conversationId!: string;
  replyToMessageId: string | null = null;

  private threadService = inject(ThreadService);

  // Inject AuthService to get current user information
  private authService = inject(AuthService);

  //inject ActivatedRoute to get current url
  private route = inject(ActivatedRoute);

  //Inject route. with this we have acces to type and id
  private chatService = inject(ChatActiveRouterService);

  // Stores any error message to display in the form
  errorMessage: string | null = null;

  // Reactive form for creating a new thread with a first message
  createThreadFrom: FormGroup = new FormGroup({
    message: new FormControl('', []), // Form control for the thread's first message
  });

    ngOnInit() {
    this.chatService.getType$(this.route).subscribe(t => {
      this.type = t;
          console.log(`aici trebuie tip  |  ${this.type } `);
    });
    this.chatService.getId$(this.route).subscribe(id => {
      this.conversationId = id;
          console.log(`aici channelid    | ${this.conversationId}`);
    });
    this.chatService.getMessageId$(this.route).subscribe(msgId => {
      this.replyToMessageId = msgId; 
          console.log(` aici messageid    |  ${this.replyToMessageId}`);
    });
  }

  onSubmit() {
    const message = this.createThreadFrom.get('message')?.value;
    const currentUserId: string | null = this.authService.getCurrentUserId();
    if (this.replyToMessageId) {
      this.threadService.createThreadMessage(this.conversationId, this.replyToMessageId, currentUserId!, message, this.type);
    } else {

      this.threadService.createMessage(this.conversationId, currentUserId!, message, this.type);
    }

    this.createThreadFrom.reset();

  }
  //     .then((threadId) => {
  //       console.log('Thread created with ID:', threadId);
  //       // Re-trigger channel selection to refresh the view
  //       this.channelSelectionService.selectChannel(selectedChannel);
  //       // Reset the form after successful submission
  //       this.createThreadFrom.reset();
  //     })
  //     .catch((error) => {
  //       // Set and log error message if thread creation fails
  //       this.errorMessage = error.message;
  //       console.error('Error creating thread:', error);
  //     });
}
