import {
  Component,
  Input,
  Signal,
  effect,
  Output,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { HeaderOverlayComponent } from '../../shared/components/header-overlay/header-overlay.component';
import { ChannelInterface } from '../../shared/models/channel.interface';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../services/search.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  startWith,
  map,
  Observable,
  combineLatest,
  takeUntil,
  Subject,
  BehaviorSubject,
} from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserInterface } from '../../shared/models/user.interface';
import { ChannelsService } from '../../services/channels.service';
import { OverlayRef } from '@angular/cdk/overlay';
import { OverlayService } from '../../services/overlay.service';
import { UserListItemToChannelComponent } from '../../shared/components/user-list-item-to-channel/user-list-item-to-channel.component';
import { RectangleDragCloseDirective } from '../../shared/directives/rectangle-drag-close.directive';

@Component({
  selector: 'app-add-member-to-channel',
  imports: [
    HeaderOverlayComponent,
    CommonModule,
    ReactiveFormsModule,
    RectangleDragCloseDirective,
  ],
  templateUrl: './add-member-to-channel.component.html', // Path to the HTML template
  styleUrls: ['./add-member-to-channel.component.scss'], // Path to the styling file
})
export class AddMemberToChannelComponent {
  @Input() channelDetails$?: Observable<ChannelInterface | undefined>; // Observable to hold channel details
  @Input() onBottom: boolean = false;
  @Output() overlayRef!: OverlayRef; // Overlay reference to manage the overlay's lifecycle
  ListWithMember: UserInterface[] = []; // List of users to be added to the channel
  overlay: string = ''; // String used to manage overlay state
  private resultsOverlayRef?: OverlayRef; // Here save the overlay ref to close if results are null

  //We use this boolean to check if our overlay is open or close
  isClosing = false;

  @ViewChild('addMemberSearchBar', { static: false })
  addMemberSearchBar!: ElementRef<HTMLElement>;

  // Reactive form control for the search input
  searchControl = new FormControl<string>('', { nonNullable: true });

  // Observable stream for the search term
  private term$: Observable<string> = this.searchControl.valueChanges.pipe(
    startWith(this.searchControl.value),
    map((v) => v.trim().toLowerCase()) // Normalize the search term for matching
  );

  // Signal for storing filtered users based on the search term
  results!: Signal<UserInterface[]>;

  private destroy$ = new Subject<void>();
  membersIds$ = new BehaviorSubject<string[]>([]);

  constructor(
    private searchService: SearchService, // Service to manage search functionality
    private channelService: ChannelsService, // Service to manage channels and members
    private overlayService: OverlayService // Service for managing overlays
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
        if (!this.resultsOverlayRef) {
          this.openAddMembersToChannel();
        }
      } else if (this.resultsOverlayRef) {
        this.overlayService.closeOne(this.resultsOverlayRef);
        this.resultsOverlayRef = undefined;
      }
    });

    // Combining search term and users from the service to filter users based on the term
    this.results = toSignal(
      combineLatest([
        this.term$,
        this.searchService.users$,
        this.membersIds$,
      ]).pipe(
        map(([term, users, memberIds]) => {
          if (!term) return []; // No search term, return empty array
          return users.filter(
            (user) =>
              !memberIds.includes(user.uid) &&
              (user.name?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term))
          );
        })
      ),
      { initialValue: [] as UserInterface[] } // Initial value when no search is performed
    );
  }

  ngOnInit() {
    this.channelDetails$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe((channel) => {
        this.membersIds$.next(channel?.memberIds ?? []);
      });
    // Clear the list of users in the service when the component is initialized
    this.overlayService.clearUsers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  closeOverlay() {
    this.isClosing = true;
    setTimeout(() => {
      this.overlayService.closeAll();
    }, 500); // duration matches CSS transition
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
  openAddMembersToChannel() {
    const overlay = this.overlayService.openComponent(
      UserListItemToChannelComponent, // Component to display users
      null, // Styling for the overlay backdrop
      {
        origin: this.addMemberSearchBar.nativeElement, // Positioning of the overlay relative to the event
        originPosition: {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
        }
      },
      {
        results: this.results, // Pass filtered search results to the overlay component
        onBottom: this.onBottom,
      }
    );
    if (!overlay) return; // If overlay is not created, return
    Object.assign(overlay.ref.instance, { overlayRef: overlay.overlayRef }); // Attach the overlay reference
    this.resultsOverlayRef = overlay.overlayRef;
    this.resultsOverlayRef.backdropClick().subscribe(() => {
      this.overlayService.closeOne(this.resultsOverlayRef!);
      this.resultsOverlayRef = undefined;
    });
  }
}
