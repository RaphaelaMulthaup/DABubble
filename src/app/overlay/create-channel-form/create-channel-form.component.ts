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
import { HeaderOverlayComponent } from '../../shared/components/header-overlay/header-overlay.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-channel-form',
  imports: [FormsModule, ReactiveFormsModule, HeaderOverlayComponent, CommonModule],
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

  showErrorMessage: boolean = false;

  public overlayService = inject(OverlayService);
  
  constructor() {}

  /**
   * Handles form submission
   */
  onSubmit(): void {
    console.log('Fehler', this.errorMessage);
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
    this.handlePossibleError(name);
  }

  /**
   * 
   * Throws error-message if channel-name is taken 
   */
  handlePossibleError(name: string, description?: string): void {
    this.channelService.createChannel(name, description).subscribe({
      next: () => {
        this.errorMessage = null;
        this.createChannel.reset();
        this.overlayService.close();
      },
      error: (err) => {
        if (err.message === 'name vergeben') {
          this.showErrorMessage = true;
        } else {
          this.errorMessage = err.message;
        }
      }
    })
  }
}
