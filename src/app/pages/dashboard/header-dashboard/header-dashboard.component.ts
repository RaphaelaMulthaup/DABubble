import { Component, EventEmitter, inject, Input, OnInit, Output, WritableSignal } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { UserInterface } from '../../../shared/models/user.interface';
import { AsyncPipe } from '@angular/common';
import { MobileDashboardState } from '../../../shared/types/mobile-dashboard-state.type';
import { SearchBarComponent } from './search-bar/search-bar.component';
import { MobileService } from '../../../services/mobile.service';

@Component({
  selector: 'app-header-dashboard',
  imports: [AsyncPipe, SearchBarComponent],
  templateUrl: './header-dashboard.component.html',
  styleUrl: './header-dashboard.component.scss',
})
export class HeaderDashboardComponent implements OnInit {
  public authService = inject(AuthService);

  currentUser$?: Observable<UserInterface | null>;

  public mobileService = inject(MobileService);

  mobileDashboardState: WritableSignal<MobileDashboardState> = this.mobileService.mobileDashboardState;

  ngOnInit(): void {
    this.currentUser$ = this.authService.currentUser$;
  }
}
