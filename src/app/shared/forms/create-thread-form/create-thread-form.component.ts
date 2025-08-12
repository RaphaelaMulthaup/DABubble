import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {  FormControl, FormGroup, ReactiveFormsModule, } from '@angular/forms';
import { ThreadService } from '../../../services/thread.service';
import { ChannelSelectionService } from '../../../services/channel-selection.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-create-thread-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-thread-form.component.html',
  styleUrl: './create-thread-form.component.scss'
})
export class CreateThreadFormComponent {
  private threadService = inject(ThreadService);
  private channelSelectionService = inject(ChannelSelectionService); 
  private authService = inject(AuthService);


  errorMessage: string | null = null;
  
  
  createThreadFrom: FormGroup = new FormGroup({
    message: new FormControl('', []),
  });

  onSubmit(): void {
    const message = this.createThreadFrom.get('message')?.value;
    const selectedChannel = this.channelSelectionService.getSelectedChannelSync();
    const channelId: string | null = this.channelSelectionService.getSelectedChannelId(); 
    const currentUserId: string | null = this.authService.getCurrentUserId();
    this.threadService.createThreadWithFirstMessage(channelId!, currentUserId!, message).then(threadId => {
      console.log('Thread created with ID:', threadId);
      // Re-declanșează selecția pentru reîncărcare
      this.channelSelectionService.selectChannel(selectedChannel);
      this.createThreadFrom.reset();

    }).catch(error => {
      this.errorMessage = error.message;
      console.error('Error creating thread:', error);
    });
  }
}
