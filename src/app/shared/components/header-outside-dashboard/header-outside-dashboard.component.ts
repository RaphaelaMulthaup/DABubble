import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { ScreenSize } from '../../types/screen-size.type';
import { ScreenService } from '../../../services/screen.service';
import { AsyncPipe } from '@angular/common';
import { CreateAccountBtnComponent } from "../create-account-btn/create-account-btn.component";
import { AuthState } from '../../types/auth-state.type';

@Component({
  selector: 'app-header-outside-dashboard',
  imports: [AsyncPipe, CreateAccountBtnComponent],
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
  /**
   * Detects context and shows logo matching to intro animation in "non-auth"
   */
  ngOnInit(): void {
    if (this.context === 'non-auth') {
      setTimeout(() => {
        //this.showFinalLogo();
      }, 3200);
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

  onChildStateChange(newState: AuthState) {
    // console.log('NEWSTATE', newState);
    
    this.changeAuthState.emit(newState);
  }
}
