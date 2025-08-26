import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ChannelSelectionService } from '../../../../services/channel-selection.service';
import { AuthService } from '../../../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { ChatActiveRouterService } from '../../../../services/chat-active-router.service';
import { Router } from '@angular/router';
import { MessageService } from '../../../../services/message.service';

@Component({
  selector: 'app-current-post-input',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './current-post-input.component.html',
  styleUrl: './current-post-input.component.scss',
})
export class CurrentPostInput {

  // type!:  'channel' | 'chat';

  type!:  string;
  conversationId!: string;
  messageToReplyId: string | null = null;

  private messageService = inject(MessageService);

  // Inject AuthService to get current user information
  private authService = inject(AuthService);

  //inject ActivatedRoute to get current url
  private route = inject(ActivatedRoute);

  //Inject route. with this we have acces to type and id
  private chatActiveRouterService = inject(ChatActiveRouterService);

  // Stores any error message to display in the form
  errorMessage: string | null = null;

  // Reactive form for creating a new thread with a first message
  postForm: FormGroup = new FormGroup({
    text: new FormControl('', []), // Form control for the thread's first message
  });

  ngOnInit() {
    this.chatActiveRouterService.getType$(this.route).subscribe(t => {
      this.type = t;
      console.log(`aici trebuie tip  |  ${this.type} `);
    });
    this.chatActiveRouterService.getId$(this.route).subscribe(id => {
      this.conversationId = id;
      console.log(`aici channelid    | ${this.conversationId}`);
    });
    this.chatActiveRouterService.getMessageId$(this.route).subscribe(msgId => {
      this.messageToReplyId = msgId;
      console.log(` aici messageid    |  ${this.messageToReplyId}`);
    });
  }

  // /**
  //  * Handles form submission to create a new thread
  //  */
  // async onSubmit(): Promise<void> {
  //   const id = await firstValueFrom(this.chatActiveRouterService.getId$(this.route));
  //   const type = await firstValueFrom(this.chatActiveRouterService.getType$(this.route));

  //   // Get the message value from the form
  //   const message = this.postForm.get('message')?.value;

  //           // Get the currently selected channel synchronously
  //           const selectedChannel =
  //             this.channelSelectionService.getSelectedChannelSync();

  //           // Get the selected channel ID
  //           const channelId: string | null =
  //             this.channelSelectionService.getSelectedChannelId();

  //   // Get the ID of the current user
  //   const currentUserId: string | null = this.authService.getCurrentUserId();

  //   // Call the service to create a thread with the first message
  //   this.threadService
  //     .createMessage(
  //       channelId!,
  //       currentUserId!,
  //       message,
  //       type,
  //       id
  //     )
  //     .then((threadId) => {
  //       console.log('Thread created with ID:', threadId);

  //       // Re-trigger channel selection to refresh the view
  //       this.channelSelectionService.selectChannel(selectedChannel);

  //       // Reset the form after successful submission
  //       this.postForm.reset();
  //     })
  //     .catch((error) => {
  //       // Set and log error message if thread creation fails
  //       this.errorMessage = error.message;
  //       console.error('Error creating thread:', error);
  //     });

  onSubmit() {
    const post = this.postForm.get('text')?.value;
    const currentUserId: string | null = this.authService.getCurrentUserId();
    if (this.messageToReplyId) {
      this.messageService.createAnswer(this.conversationId, this.messageToReplyId, currentUserId!, post, this.type);
    } else {
      this.messageService.createMessage(this.conversationId, currentUserId!, post, this.type);
    }
    this.postForm.reset();
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
