import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { UserInterface } from '../../../shared/models/user.interface';
import { AsyncPipe } from '@angular/common';
import { MobileDashboardState } from '../../../shared/types/mobile-dashboard-state.type';
import { SearchBarComponent } from './search-bar/search-bar.component';

@Component({
  selector: 'app-header-dashboard',
  imports: [AsyncPipe, SearchBarComponent],
  templateUrl: './header-dashboard.component.html',
  styleUrl: './header-dashboard.component.scss',
})
export class HeaderDashboardComponent implements OnInit {
  public authService = inject(AuthService);

  currentUser$?: Observable<UserInterface | null>;

  @Input() currentMobileDashboardState: MobileDashboardState = 'sidenav';
  @Output() changeMobileDashboardState = new EventEmitter<MobileDashboardState>();

  ngOnInit(): void {
    this.currentUser$ = this.authService.currentUser$;
  }

  backToSidenav() {
    this.changeMobileDashboardState.emit('sidenav');
  }
}
