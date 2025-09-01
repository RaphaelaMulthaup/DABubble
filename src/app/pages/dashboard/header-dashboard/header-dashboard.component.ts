import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { UserInterface } from '../../../shared/models/user.interface';
import { AsyncPipe } from '@angular/common';
import { MobileDashboardState } from '../../../shared/types/mobile-dashboard-state.type';
import { SearchBarComponent } from './search-bar/search-bar.component';
import { ProfileViewMainComponent } from '../../../overlay/profile-view-main/profile-view-main.component';

@Component({
  selector: 'app-header-dashboard',
  imports: [
    AsyncPipe,
    SearchBarComponent,
    ProfileViewMainComponent,
  ],
  templateUrl: './header-dashboard.component.html',
  styleUrl: './header-dashboard.component.scss',
})
export class HeaderDashboardComponent implements OnInit {
  private authService = inject(AuthService);

  currentUser$?: Observable<UserInterface | null>;

  @Input() currentMobileDashboardState: MobileDashboardState = 'sidenav';
  @Output() changeMobileDashboardState = new EventEmitter<MobileDashboardState>();

  ngOnInit(): void {
    this.currentUser$ = this.authService.currentUser$;
  }

  backToSidenav() {
    this.changeMobileDashboardState.emit('sidenav');
  }

  showProfile() {
    let profile = document.querySelector('.profile-view');
    profile?.classList.add('showProfile');
  }
}
