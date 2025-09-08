import { inject, Injectable, signal } from '@angular/core';
import { MobileDashboardState } from '../shared/types/mobile-dashboard-state.type';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class MobileService {
  mobileDashboardState = signal<MobileDashboardState>('sidenav');

  constructor(private router: Router) {}

  isMobile(): boolean {
    return window.innerWidth < 768; // you can adjust breakpoint
  }

  setMobileDashboardState(state: MobileDashboardState) {
    this.mobileDashboardState.set(state);
    if (state === 'sidenav') {
      this.router.navigate(['/dashboard']);
    }
  }
}
