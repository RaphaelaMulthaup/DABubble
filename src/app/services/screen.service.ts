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
  sidenavVisible: boolean = true;

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
  }

  setDashboardState(state: DashboardState) {
    this.dashboardState.set(state);
    if (state === 'sidenav') {
      this.router.navigate(['/dashboard']);
    }
  }

  async setDashboardStateAfterLogin() {
    const currentScreenSize = await firstValueFrom(this.screenSize$);
    if (currentScreenSize !== 'handset') {
      this.setDashboardState('new-message-view');
    }
  }
}
