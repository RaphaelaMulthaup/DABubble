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
  take,
} from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserInterface } from '../../shared/models/user.interface';
import { ChannelsService } from '../../services/channels.service';
import { OverlayRef } from '@angular/cdk/overlay';
import { OverlayService } from '../../services/overlay.service';
import { UserListItemToChannelComponent } from '../../shared/components/user-list-item-to-channel/user-list-item-to-channel.component';
import { RectangleDragCloseDirective } from '../../shared/directives/rectangle-drag-close.directive';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-add-member-to-channel',
  imports: [
    HeaderOverlayComponent,
    CommonModule,
    ReactiveFormsModule,
    RectangleDragCloseDirective,
  ],
  templateUrl: './add-member-to-channel.component.html',
  styleUrls: ['./add-member-to-channel.component.scss'],
})
export class AddMemberToChannelComponent {
  @Input() channelDetails$?: Observable<ChannelInterface | undefined>;
  @Input() onBottom: boolean = false;
  @Output() overlayRef!: OverlayRef;

  @ViewChild('addMemberSearchBar', { static: false })
  addMemberSearchBar!: ElementRef<HTMLElement>;
  searchControl = new FormControl<string>('', { nonNullable: true });
  membersIds$ = new BehaviorSubject<string[]>([]);
  allContactsSelected$ = new BehaviorSubject<boolean>(false);
  results!: Signal<UserInterface[]>;
  private destroy$ = new Subject<void>();
  private term$: Observable<string> = this.searchControl.valueChanges.pipe(
    startWith(this.searchControl.value),
    map((v) => v.trim().toLowerCase())
  );

  membersList: UserInterface[] = [];
  private resultsOverlayRef?: OverlayRef;
  isClosing = false;
  overlay: string = '';
  addMemberToChannel:boolean = false;
  isChannelNew = false;

  constructor(
    private channelService: ChannelsService,
    private overlayService: OverlayService,
    private searchService: SearchService,
    public userService: UserService
  ) {
    effect(() => {
      if (this.overlayService.searchReset()) {
        this.searchControl.reset();
        this.overlayService.clearReset();
      }
    });
    effect(() => this.membersList = this.overlayService.users());
    effect(() => {
      const r = this.results();
      if (r.length > 0) {
        if (!this.resultsOverlayRef) this.openAddMembersToChannel();
      } else if (this.resultsOverlayRef) {
        this.overlayService.closeOne(this.resultsOverlayRef);
        this.resultsOverlayRef = undefined;
      }
    });
    this.results = toSignal(
      combineLatest([ this.term$, this.searchService.users$, this.membersIds$ ]).pipe(
        map(([term, users, memberIds]) => {
          if (!term) return [];
          return users.filter((user) => !memberIds.includes(user.uid) && (user.name?.toLowerCase().includes(term) || user.email?.toLowerCase().includes(term)));
        })
      ),
      { initialValue: [] as UserInterface[] }
    );
  }

  ngOnInit() {
    if(this.isChannelNew) this.allContactsSelected$.next(true);
    this.channelDetails$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe((channel) => this.membersIds$.next(channel?.memberIds ?? []));
    this.overlayService.clearUsers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggles the Radio-Btn state to switch between adding all or just selected contacts to a channel.
   */
  toggleRadioBtn() {
    const currentRadioBtnState = this.allContactsSelected$.value
    this.allContactsSelected$.next(!currentRadioBtnState);
  }

  /**
   * Selects all contacts as members for a new channel.
   */
  selectAllContacts() {
    this.allContactsSelected$.next(true);
    this.addMemberToChannel = false;
  }

  /**
   * Selects only specific contacts as members for a new channel.
   */
  selectSpecificContacts() {
    this.allContactsSelected$.next(false);
    this.addMemberToChannel = true;
  }

  /**
   * This function closes all overlays after the animation.
   */
  closeOverlay() {
    this.isClosing = true;
    setTimeout(() => this.overlayService.closeAll(), 500);
  }

  /**
   * Method to extract the first word of a user's name.
   *
   * @param name - the users name
   */
  getFirstWord(name: string): string {
    return name.split(' ')[0];
  }

  /**
   * Method to remove a user from the list and update the service.
   *
   * @param index - the users index in the membersLists
   */
  removeFromList(index: number) {
    const updatedUsers = [...this.membersList];
    updatedUsers.splice(index, 1);
    this.overlayService.setUsers(updatedUsers);
  }

  /**
   * Method to add members to the channel, calling the service method to update the channel.
   *
   * @param channelId - the ID of the channel
   */
  addMembertoChannel(channelId: string) {
    if (this.allContactsSelected$.value === true) {
      this.searchService.getUsers$()
      .pipe(take(1))
      .subscribe((users) => {
        const allUserIds = users.map((user) => user.uid);
        this.channelService.addMemberToChannel(channelId, allUserIds);
      })
    } else {
      const membersId = this.membersList.map((user) => user.uid);
      this.channelService.addMemberToChannel(channelId, membersId);
    }
    this.overlayService.clearUsers();
    this.overlayService.closeAll();
  }

  /**
   * This function opens the UserListItemToChannel-Overlay.
   */
  openAddMembersToChannel() {
    const overlay = this.overlayService.openComponent(
      UserListItemToChannelComponent,
      null,
      {
        origin: this.addMemberSearchBar.nativeElement,
        originPosition: { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
        originPositionFallback: { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
      },
      {
        results: this.results,
        onBottom: this.onBottom,
      }
    );
    if (!overlay) return;
    this.configureResultsOverlay(overlay);
  }

  /**
   * Configures the overlay behavior and handles closing logic.
   *
   * @param overlay - the UserListItemToChannel-Overlay
   */
  configureResultsOverlay(overlay: any) {
    Object.assign(overlay.ref.instance, { overlayRef: overlay.overlayRef });
    this.resultsOverlayRef = overlay.overlayRef;
    this.resultsOverlayRef!.backdropClick().subscribe(() => {
      this.overlayService.closeOne(this.resultsOverlayRef!);
      this.resultsOverlayRef = undefined;
    });
  }
}