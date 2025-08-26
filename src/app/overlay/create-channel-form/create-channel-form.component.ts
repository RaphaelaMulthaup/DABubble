import { Component, EventEmitter, inject, Output } from '@angular/core';
import { ChannelsService } from '../../services/channels.service';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  Validators,
} from '@angular/forms';
import { OverlayService } from '../../services/overlay.service';

@Component({
  selector: 'app-create-channel-form',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './create-channel-form.component.html',
  styleUrl: './create-channel-form.component.scss',
})
export class CreateChannelFormComponent {
  // Event emitter to notify parent to close the form
  @Output() close = new EventEmitter<void>();

  // Event emitter to notify parent when the form is submitted
  @Output() submitForm = new EventEmitter<any>();

  // Inject the channel service to interact with backend
  channelService = inject(ChannelsService);

  // Stores an error message if form submission fails
  errorMessage: string | null = null;

  // Form group for creating a channel
  createChannel: FormGroup = new FormGroup({
    // Name field is required, no specific character limit
    name: new FormControl('', [Validators.required]),

    // Description field is optional
    description: new FormControl(''),
  });


    private overlayService = inject(OverlayService);
  
  constructor() {}

  /**
   * Handles form submission
   */
  onSubmit(): void {
    // Check if the form is valid
    if (this.createChannel.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    const name = this.createChannel.get('name')?.value?.trim();
    const descriptionValue = this.createChannel
      .get('description')
      ?.value?.trim();

    // Convert empty string to undefined
    const description = descriptionValue ? descriptionValue : undefined;

    // Call the service to create a channel
    this.channelService.createChannel(name, description).subscribe({
      next: () => {
        console.log('Channel created successfully');
        this.errorMessage = null;
        this.createChannel.reset();
        this.overlayService.hideOverlay();
      },
      error: (err: { code: string | null }) => {
        this.errorMessage = err.code; // Set error message from backend
      },
    });
  }

    hideOverlay(){
    this.overlayService.hideOverlay();
  }

  /**
   * Handles form closing without submission
   */
  onClose() {
    this.close.emit();
  }
}
