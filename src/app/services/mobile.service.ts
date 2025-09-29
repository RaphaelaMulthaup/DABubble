import { inject, Injectable, signal } from '@angular/core';
import { MobileDashboardState } from '../shared/types/mobile-dashboard-state.type';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class MobileService {
  public mobileDashboardState = signal<MobileDashboardState>('sidenav');

  constructor(private router: Router) {}

  setMobileDashboardState(state: MobileDashboardState) {
    this.mobileDashboardState.set(state);
    if (state === 'sidenav') {
      this.router.navigate(['/dashboard']);
    }
  }
}
