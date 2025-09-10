import {
  Component,
  Input,
  Signal,
  effect,
  inject,
  OnInit,
  Output,
} from '@angular/core';
import { HeaderOverlayComponent } from '../../shared/components/header-overlay/header-overlay.component';
import { ChannelInterface } from '../../shared/models/channel.interface';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../services/search.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, startWith, map, Observable, combineLatest } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserInterface } from '../../shared/models/user.interface';
import { ChannelsService } from '../../services/channels.service';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { OverlayService } from '../../services/overlay.service';
import { UserListItemToChannelComponent } from '../../shared/components/user-list-item-to-channel/user-list-item-to-channel.component';

@Component({
  selector: 'app-add-member-to-channel',
  imports: [HeaderOverlayComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './add-member-to-channel.component.html', // Path to the HTML template
  styleUrl: './add-member-to-channel.component.scss',  // Path to the styling file
})
export class AddMemberToChannelComponent {
  @Input() channelDetails$?: Observable<ChannelInterface | undefined>; // Observable to hold channel details
  @Output() overlayRef!: OverlayRef; // Overlay reference to manage the overlay's lifecycle
  ListWithMember: UserInterface[] = []; // List of users to be added to the channel
  overlay: string = ''; // String used to manage overlay state

  // Reactive form control for the search input
  searchControl = new FormControl<string>('', { nonNullable: true });

  // Observable stream for the search term (debounced for performance)
  private term$: Observable<string> = this.searchControl.valueChanges.pipe(
    startWith(this.searchControl.value),
    debounceTime(300),
    map((v) => v.trim().toLowerCase()) // Normalize the search term for matching
  );

  // Signal for storing filtered users based on the search term
  results!: Signal<UserInterface[]>;

  constructor(
    private searchService: SearchService,   // Service to manage search functionality
    private channelService: ChannelsService, // Service to manage channels and members
    private overlayService: OverlayService   // Service for managing overlays
  ) {
    // Reacting to reset signal to clear the search field
    effect(() => {
      if (this.overlayService.searchReset()) {
        this.searchControl.reset(); // Reset the search control
        this.overlayService.clearReset(); // Clear the reset signal
      }
    });

    // Reacting to changes in the user list (adding/removing members)
    effect(() => {
      this.ListWithMember = this.overlayService.users(); // Get updated list of users from service
    });

    // Trigger the overlay for adding members when results are available
    effect(() => {
      const r = this.results();
      if (r.length > 0) {
        this.openAddMembersToChannel(new MouseEvent('click'));
      }
    });

    // Combining search term and users from the service to filter users based on the term
    this.results = toSignal(
      combineLatest([this.term$, this.searchService.users$]).pipe(
        map(([term, users]) => {
          if (!term) return []; // No search term, return empty array
          return users.filter(
            (user) =>
              user.name?.toLowerCase().includes(term) ||
              user.email?.toLowerCase().includes(term) // Filter users by name or email
          );
        })
      ),
      { initialValue: [] as UserInterface[] } // Initial value when no search is performed
    );
  }

  ngOnInit() {
    // Clear the list of users in the service when the component is initialized
    this.overlayService.clearUsers();
  }

  // Method to extract the first word of a user's name
  getFirstWord(name: string): string {
    return name.split(' ')[0];
  }

  // Method to remove a user from the list and update the service
  removeFromList(index: number) {
    const updatedUsers = [...this.ListWithMember];
    updatedUsers.splice(index, 1); // Remove user from the array
    this.overlayService.setUsers(updatedUsers); // Update the users list in the service
  }

  // Method to add members to the channel, calling the service method to update the channel
  addMembertoChannel(channelId: string) {
    const membersId = this.ListWithMember.map((user) => user.uid); // Collect member IDs
    this.channelService.addMemberToChannel(channelId, membersId); // Add members to channel

    // Reset the list of users in the service after adding members
    this.overlayService.clearUsers();
    this.overlayService.closeAll(); // Close all open overlays
  }

  // Method to open the overlay for adding members to the channel
  openAddMembersToChannel(event: MouseEvent) {
    const overlay = this.overlayService.openComponent(
      UserListItemToChannelComponent, // Component to display users
      'cdk-overlay-dark-backdrop', // Styling for the overlay backdrop
      {
        origin: event.currentTarget as HTMLElement, // Positioning of the overlay relative to the event
        originPosition: {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
        },
        originPositionFallback: {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
        },
      },
      {
        results: this.results, // Pass filtered search results to the overlay component
      }
    );

    if (!overlay) return; // If overlay is not created, return
    Object.assign(overlay.ref.instance, { overlayRef: overlay.overlayRef }); // Attach the overlay reference
  }
}
