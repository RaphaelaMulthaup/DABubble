import {
  Component,
  EventEmitter,
  inject,
  OnInit,
  Output,
  WritableSignal,
} from '@angular/core';
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
import { AddMemberToChannelComponent } from '../add-member-to-channel/add-member-to-channel.component';
import { ChannelInterface } from '../../shared/models/channel.interface';
import { Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { ScreenSize } from '../../shared/types/screen-size.type';
import { ScreenService } from '../../services/screen.service';
import { DashboardState } from '../../shared/types/dashboard-state.type';

@Component({
  selector: 'app-create-channel-form',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    HeaderOverlayComponent,
    CommonModule,
    AddMemberToChannelComponent,
  ],
  templateUrl: './create-channel-form.component.html',
  styleUrl: './create-channel-form.component.scss',
})
export class CreateChannelFormComponent {
  // Event emitter to notify parent to close the form
  @Output() close = new EventEmitter<void>();

  // Event emitter to notify parent when the form is submitted
  @Output() submitForm = new EventEmitter<any>();

  dashboardState!: WritableSignal<DashboardState>;
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
  createSub: any;

  inviteMembers: boolean = false;
  channel: ChannelInterface | undefined;
  channel$!: Observable<ChannelInterface | undefined>;
  screenSize$!: Observable<ScreenSize>;

  constructor(
    public overlayService: OverlayService,
    private channelService: ChannelsService,
    private router: Router,
    public screenService: ScreenService
  ) {
    this.dashboardState = this.screenService.dashboardState;
    this.screenSize$ = this.screenService.screenSize$;
  }

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
    if (this.createSub) {
      this.createSub.unsubscribe();
    }
    this.createSub = this.channelService
      .createChannel(name, description)
      .subscribe({
        next: (channel) => {
          this.errorMessage = null;
          this.createChannel.reset();
          this.channel = channel;
          this.router.navigate(['/dashboard', 'channel', channel?.id]);
          this.screenService.setDashboardState('message-window');
          this.openAddMembersToChannel();
        },
        error: (err) => {
          if (err.message === 'name vergeben') {
            this.showErrorMessage = true;
          } else {
            this.errorMessage = err.message;
          }
        },
      });
  }

  /**
   *  Function witch transform a normal object to a observable.
   */
  channelToObservable() {
    this.channel$ = of(this.channel);
    return this.channel$;
  }

  /**
   * Ends subscription if necessary.
   */
  ngOnDestroy() {
    if (this.createSub) {
      this.createSub.unsubscribe();
    }
  }

  /**
   * Check if name is taken on interaction.
   */
  onNameInput(): void {
    const nameControl = this.createChannel.get('name');
    const value = nameControl?.value.trim();

    if (this.showErrorMessage && value && value !== '') {
      this.showErrorMessage = false;
      this.errorMessage = null;
    }
  }

  openAddMembersToChannel() {
    this.overlayService.openComponent(
      AddMemberToChannelComponent,
      'cdk-overlay-dark-backdrop',
      {
        globalPosition: 'center',
      },
      {
        channelDetails$:
          this.channelToObservable() as Observable<ChannelInterface>,
        overlay: 'overlay',
      }
    );
  }
}
