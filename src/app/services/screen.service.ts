import { Injectable, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { firstValueFrom, map, Observable, shareReplay } from 'rxjs';
import { ScreenSize } from '../shared/types/screen-size.type';
import { BREAKPOINTS } from '../shared/constants/breakpoints';
import { MobileDashboardState } from '../shared/types/mobile-dashboard-state.type';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ScreenService {
  public screenSize$: Observable<ScreenSize>;
  public breakpoints = BREAKPOINTS;
  public mobileDashboardState = signal<MobileDashboardState>('sidenav');

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
        shareReplay(1)
      );

    setTimeout(async () => {
      const initialScreenSize = await firstValueFrom(this.screenSize$);
      if (initialScreenSize === 'web') {
        this.setMobileDashboardState('new-message-view');
      }
    });
  }

  setMobileDashboardState(state: MobileDashboardState) {
    this.mobileDashboardState.set(state);
    if (state === 'sidenav') {
      this.router.navigate(['/dashboard']);
    }
  }
}
