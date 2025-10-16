import { Component, HostBinding, Input, Signal } from '@angular/core';
import { UserListItemComponent } from '../../shared/components/user-list-item/user-list-item.component';
import { ChannelListItemComponent } from '../../shared/components/channel-list-item/channel-list-item.component';
import { PostListItemComponent } from '../../shared/components/post-list-item/post-list-item.component';
import { OverlayService } from '../../services/overlay.service';
import { CommonModule } from '@angular/common';
import { ScreenService } from '../../services/screen.service';
import { Observable, Subscription } from 'rxjs';
import { ScreenSize } from '../../shared/types/screen-size.type';

@Component({
  selector: 'app-search-results',
  imports: [
    UserListItemComponent,
    ChannelListItemComponent,
    PostListItemComponent,
    CommonModule,
  ],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss',
})
export class SearchResultsComponent {
  @Input() results$!: Signal<any[]>;
  @Input() searchTerm: string = '';

  public screenSize$!: Observable<ScreenSize>;
  private subscription!: Subscription;
  private screenSize: string | null = null;

  constructor(
    public overlayService: OverlayService,
    public screenService: ScreenService
  ) {
    this.screenSize$ = this.screenService.screenSize$;
  }

  ngOnInit() {
    this.subscription = this.screenService.screenSize$.subscribe((size) => {
      this.screenSize = size;
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /**
   * Host binding for the `overlay-web` CSS class.
   * Applies the class only if the screen size is NOT 'handset' (i.e., desktop or tablet view).
   * This allows for different styling and positioning of the overlay depending on device type.
   * Returns true if class should be applied, false otherwise.
   */
  @HostBinding('class.overlay-web')
  get overlayWeb(): boolean {
    return this.screenSize !== 'handset';
  }
}
