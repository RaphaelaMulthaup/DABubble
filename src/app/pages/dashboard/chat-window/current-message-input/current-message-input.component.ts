import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ThreadService } from '../../../../services/thread.service';
import { ChannelSelectionService } from '../../../../services/channel-selection.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-current-message-input',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './current-message-input.component.html',
  styleUrl: './current-message-input.component.scss'
})
export class CurrentMessageInput {
  private threadService = inject(ThreadService);

  // Inject ChannelSelectionService to manage selected channel
  private channelSelectionService = inject(ChannelSelectionService); 

  // Inject AuthService to get current user information
  private authService = inject(AuthService);

  // Stores any error message to display in the form
  errorMessage: string | null = null;
  
  // Reactive form for creating a new thread with a first message
  createThreadFrom: FormGroup = new FormGroup({
    message: new FormControl('', []), // Form control for the thread's first message
  });

  /**
   * Handles form submission to create a new thread
   */
  onSubmit(): void {
    // Get the message value from the form
    const message = this.createThreadFrom.get('message')?.value;

    // Get the currently selected channel synchronously
    const selectedChannel = this.channelSelectionService.getSelectedChannelSync();

    // Get the selected channel ID
    const channelId: string | null = this.channelSelectionService.getSelectedChannelId(); 

    // Get the ID of the current user
    const currentUserId: string | null = this.authService.getCurrentUserId();

    // Call the service to create a thread with the first message
    this.threadService.createThreadWithFirstMessage(channelId!, currentUserId!, message)
      .then(threadId => {
        console.log('Thread created with ID:', threadId);

        // Re-trigger channel selection to refresh the view
        this.channelSelectionService.selectChannel(selectedChannel);

        // Reset the form after successful submission
        this.createThreadFrom.reset();

      })
      .catch(error => {
        // Set and log error message if thread creation fails
        this.errorMessage = error.message;
        console.error('Error creating thread:', error);
      });
  }
}
