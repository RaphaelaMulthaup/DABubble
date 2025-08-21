import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreadService } from '../../../../services/thread.service';
import { ChannelSelectionService } from '../../../../services/channel-selection.service';
import { ActivatedRoute } from '@angular/router';
import { ChatActiveRouterService } from '../../../../services/chat-active-router.service';
import { AuthService } from '../../../../services/auth.service';
import { FormControl, FormGroup } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-current-thread-input',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './current-thread-input.component.html',
  styleUrl: './current-thread-input.component.scss'
})
export class CurrentThreadInputComponent {
  private threadService = inject(ThreadService);

  // Inject ChannelSelectionService to manage selected channel
  private channelSelectionService = inject(ChannelSelectionService);

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

  /**
   * Handles form submission to create a new thread
   */
  async onSubmit(): Promise<void> {

    //Get the id from Channel
    const id = await firstValueFrom(this.chatService.getId$(this.route));
    //Get the type from url
    const type = await firstValueFrom(this.chatService.getType$(this.route));
    const messageId = await firstValueFrom(this.chatService.getMessageId$(this.route));
    // Get the message value from the form
    const message = this.createThreadFrom.get('message')?.value;

    // Get the ID of the current user
    const currentUserId: string | null = this.authService.getCurrentUserId();

    // Call the service to create a thread with the first message
    this.threadService.createThreadMessage(id,messageId,currentUserId!,message,type)
      .then((threadId) => {
        console.log('Thread created with ID:', threadId);
        // Reset the form after successful submission
        this.createThreadFrom.reset();
      })
      .catch((error) => {
        // Set and log error message if thread creation fails
        this.errorMessage = error.message;
        console.error('Error creating thread:', error);
      });
  }
}
