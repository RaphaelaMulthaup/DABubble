import { Component, EventEmitter, Output, WritableSignal } from '@angular/core';
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
import { ConversationActiveRouterService } from '../../services/conversation-active-router.service';

@Component({
  selector: 'app-create-channel-form',
  imports: [ FormsModule, ReactiveFormsModule, CommonModule ],
  templateUrl: './create-channel-form.component.html',
  styleUrl: './create-channel-form.component.scss',
})
export class CreateChannelFormComponent {
  @Output() close = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<any>();

  createSub: any;
  dashboardState!: WritableSignal<DashboardState>;
  channel$!: Observable<ChannelInterface | undefined>;
  screenSize$!: Observable<ScreenSize>;
  createChannel: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    description: new FormControl(''),
  });

  channel: ChannelInterface | undefined;
  errorMessage: string | null = null;
  showErrorMessage: boolean = false;
  inviteMembers: boolean = false;

  constructor(
    private channelService: ChannelsService,
    private conversationActiveRouterService: ConversationActiveRouterService,
    public overlayService: OverlayService,
    private router: Router,
    public screenService: ScreenService
  ) {
    this.dashboardState = this.screenService.dashboardState;
    this.screenSize$ = this.screenService.screenSize$;
  }

  ngOnDestroy() {
    if (this.createSub) this.createSub.unsubscribe();
  }

  /**
   * Check if name is taken on interaction.
   */
  onNameInput() {
    const nameControl = this.createChannel.get('name');
    const value = nameControl?.value.trim();
    if (this.showErrorMessage && value && value !== '') {
      this.showErrorMessage = false;
      this.errorMessage = null;
    }
  }

  /**
   * Handles form submission.
   */
  onSubmit() {
    if (this.createChannel.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }
    const name = this.createChannel.get('name')?.value?.trim();
    const descriptionValue = this.createChannel.get('description')?.value?.trim();
    const description = descriptionValue ? descriptionValue : undefined;
    this.tryCreateChannel(name);
  }

  /**
   * Attempts to create a channel.
   * Throws error-message if channel-name is taken.
   *
   * @param name - the channel-name
   * @param description - the channel-description
   */
  tryCreateChannel(name: string, description?: string) {
    if (this.createSub) this.createSub.unsubscribe();
    this.createSub = this.channelService
      .createChannel(name, description)
      .subscribe({
        next: (channel) => this.handleSuccessfulChannelCreation(channel!),
        error: (err) => this.handleChannelCreationError(err)
      });
  }

  /**
   * Handles a successful channel creation.
   *
   * @param channel - the created channel
   */
  handleSuccessfulChannelCreation(channel: ChannelInterface) {
    this.errorMessage = null;
    this.createChannel.reset();
    this.channel = channel;
    this.conversationActiveRouterService.currentConversation.set(channel.id!)
    this.router.navigate(['/dashboard', 'channel', channel?.id]);
    this.screenService.setDashboardState('message-window');
    this.openAddMembersToChannelOverlay();
  }

  /**
   * This function opens the AddMemberToChannel-Overlay.
   */
  openAddMembersToChannelOverlay() {
    this.overlayService.openComponent(
      AddMemberToChannelComponent,
      'cdk-overlay-dark-backdrop',
      { globalPosition: 'center' },
      {
        channelDetails$: this.channelToObservable() as Observable<ChannelInterface>,
        overlay: 'overlay',
        isChannelNew: true
      }
    );
  }

  /**
   *  Function witch transform a normal object to a observable.
   */
  channelToObservable() {
    this.channel$ = of(this.channel);
    return this.channel$;
  }

  /**
   * Handles error with channel creation.
   *
   * @param error - the error occured
   */
  handleChannelCreationError(error: any) {
    if (error.message === 'name vergeben') {
      this.showErrorMessage = true;
    } else this.errorMessage = error.message;
  }
}
