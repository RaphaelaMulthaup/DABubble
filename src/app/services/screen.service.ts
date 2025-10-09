import { Injectable, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { firstValueFrom, map, Observable, shareReplay } from 'rxjs';
import { ScreenSize } from '../shared/types/screen-size.type';
import { BREAKPOINTS } from '../shared/constants/breakpoints';
import { DashboardState } from '../shared/types/dashboard-state.type';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ScreenService {
  screenSize$: Observable<ScreenSize>;
  breakpoints = BREAKPOINTS;
  dashboardState = signal<DashboardState>('sidenav');
  sidenavVisible: boolean = true;                     //This can be toggled by clicking the collapsible in tablet- and webversion.

  constructor(
    private breakpointObserver: BreakpointObserver,
    private router: Router
  ) {
    this.screenSize$ = this.breakpointObserver
      .observe([
        this.breakpoints.Handset,
        this.breakpoints.Tablet,
        this.breakpoints.Web,
      ])
      .pipe(
        map((result) => {
          if (result.breakpoints[this.breakpoints.Handset]) return 'handset';
          if (result.breakpoints[this.breakpoints.Tablet]) return 'tablet';
          if (result.breakpoints[this.breakpoints.Web]) return 'web';
          return 'web';
        }),
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this.setInitDashboardState();
  }

  /**
   * This function sets a new dashboard-state.
   * If the set state is 'sidenav' the active route is set to the default-state.
   * 
   * @param state - the dashboard-state-type
   */
  setDashboardState(state: DashboardState) {
    this.dashboardState.set(state);
    if (state === 'sidenav') {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * This function sets the initial dashboard-state according to the screen size,
   * which is 'sidenav' for handset and new-message-view for tablets and web.
   */
  async setInitDashboardState() {
    const currentScreenSize = await firstValueFrom(this.screenSize$);
    if (currentScreenSize === 'handset') {
      this.setDashboardState('sidenav');
    } else {
      this.router.navigate(['/dashboard', 'new-message']);
      this.setDashboardState('new-message-view');
    };
  }
}
