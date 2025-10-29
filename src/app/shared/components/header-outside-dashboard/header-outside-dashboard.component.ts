import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { ScreenSize } from '../../types/screen-size.type';
import { ScreenService } from '../../../services/screen.service';
import { AsyncPipe } from '@angular/common';
import { CreateAccountBtnComponent } from '../create-account-btn/create-account-btn.component';
import { AuthState } from '../../types/auth-state.type';
import { IntroComponent } from '../../../pages/non-auth/intro/intro.component';

@Component({
  selector: 'app-header-outside-dashboard',
  imports: [
    AsyncPipe, 
    CreateAccountBtnComponent,
    IntroComponent
  ],
  templateUrl: './header-outside-dashboard.component.html',
  styleUrl: './header-outside-dashboard.component.scss',
})
export class HeaderOutsideDashboardComponent {
  @Input() context!: string;
  @Input() currentState!: AuthState;
  @Output() changeAuthState = new EventEmitter<AuthState>();
  screenSize$!: Observable<ScreenSize>;

  constructor(public screenService: ScreenService) {
    this.screenSize$ = this.screenService.screenSize$;
  }

  ngOnInit() {
    this.showLogo();
  }

  /**
   * Detects context and shows logo matching to intro animation in "non-auth"
   */
  showLogo() {
    if (this.context === 'non-auth') {
    } else {
      this.showFinalLogo();
    }
  }

  /**
   * Shows Logo in the final position of the intro animation
   */
  showFinalLogo() {
    let finalLogo = document.querySelector('.logo-final');
    finalLogo?.classList.add('showLogo');
  }

  /**
   * Changes the Auth-State.
   * 
   * @param newState - the new AuthState
   */
  onChildStateChange(newState: AuthState) {
    this.changeAuthState.emit(newState);
  }
}
