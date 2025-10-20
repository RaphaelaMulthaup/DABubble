import {
  ChangeDetectionStrategy,
  Component,
  WritableSignal,
} from '@angular/core';
import { SidenavComponent } from './sidenav/sidenav.component';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../services/overlay.service';
import { HeaderDashboardComponent } from './header-dashboard/header-dashboard.component';
import { RouterOutlet } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { DashboardState } from '../../shared/types/dashboard-state.type';
import { ScreenService } from '../../services/screen.service';
import { ScreenSize } from '../../shared/types/screen-size.type';
import { SearchResult } from '../../shared/types/search-result.type';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-dashboard',
  imports: [
    SidenavComponent,
    CommonModule,
    HeaderDashboardComponent,
    RouterOutlet,
  ],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  dashboardState!: WritableSignal<DashboardState>;
  results$ = new BehaviorSubject<SearchResult[]>([]);
  resultsSignal = toSignal(this.results$.asObservable(), { initialValue: [] });
  screenSize$!: Observable<ScreenSize>;
  hasInput: boolean = false;

  constructor(
    public overlayService: OverlayService,
    public screenService: ScreenService
  ) {
    this.dashboardState = this.screenService.dashboardState;
    this.screenSize$ = this.screenService.screenSize$;
  }

  toggleSidenavVisibility() {
    const current = this.screenService.sidenavVisible$.value;
    this.screenService.sidenavVisible$.next(!current);
  }

  /**
   * Ends editing the current post by resetting the `editingPostId` in the OverlayService.
   */
  endEditingPost() {
    this.overlayService.editingPostId.set(null);
  }
}
