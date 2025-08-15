import { Component, EventEmitter, inject, Output } from '@angular/core';
import { ChannelsService } from '../../../services/channels.service';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-create-channel-form',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './create-channel-form.component.html',
  styleUrl: './create-channel-form.component.scss',
})
export class CreateChannelFormComponent {
  @Output() close = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<any>();

  channelService = inject(ChannelsService);
  errorMessage: string | null = null;

  createChannel: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]), // keine besondere Zeichenanzahl notwendig
    description: new FormControl(''), // nicht required
  });

  constructor() {}

  onSubmit(): void {
    if (this.createChannel.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    const name = this.createChannel.get('name')?.value;
    const description = this.createChannel.get('description')?.value;

    this.channelService.createChannel(name, description).subscribe({
      next: () => {
        console.log('Channel created successfully');
        this.errorMessage = null;
        this.createChannel.reset();
        this.close.emit();
      },
      error: (err: { code: string | null }) => {
        this.errorMessage = err.code;
      },
    });
  }

  onClose() {
    this.close.emit();
  }
}
