import { Injectable, signal } from '@angular/core';
import { MobileDashboardState } from '../shared/types/mobile-dashboard-state.type';

@Injectable({
  providedIn: 'root'
})
export class MobileService {
  mobileDashboardState = signal<MobileDashboardState>('message-window');

  setMobileDashboardState(state: MobileDashboardState) {
    this.mobileDashboardState.set(state);
  }
}
