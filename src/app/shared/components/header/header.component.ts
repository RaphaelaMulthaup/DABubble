import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { UserInterface } from '../../models/user.interface';
import { AsyncPipe } from '@angular/common';
import { MobileDashboardState } from '../../mobile-dashboard-state.type';
import { SearchBarComponent } from './search-bar/search-bar.component';

@Component({
  selector: 'app-header',
  imports: [AsyncPipe, SearchBarComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);

  currentUser$?: Observable<UserInterface | null>;

  @Input() currentMobileDashboardState: MobileDashboardState = 'sidenav';
  @Output() changeMobileDashboardState = new EventEmitter<MobileDashboardState>();

  ngOnInit(): void {
    //wenn noch nicht eingeloggt
    setTimeout(() => {
      this.showFinalLogo();
    }, 5600);
    //wenn eingeloggt
    this.currentUser$ = this.authService.currentUser$;
  }

  /**
   * Shows Logo in the final position of the intro animation
   */
  showFinalLogo() {
    let finalLogo = document.querySelector('.logo-final');
    finalLogo?.classList.add('showLogo');
  }

  backToSidenav() {
    this.changeMobileDashboardState.emit('sidenav');
  }
}
