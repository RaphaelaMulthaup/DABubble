import { Component, EventEmitter, Output } from '@angular/core';
import { AuthState } from '../../types/auth-state.type';
import { Observable } from 'rxjs';
import { ScreenSize } from '../../types/screen-size.type';
import { ScreenService } from '../../../services/screen.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-account-btn',
  imports: [CommonModule],
  templateUrl: './create-account-btn.component.html',
  styleUrl: './create-account-btn.component.scss',
})
export class CreateAccountBtnComponent {
  @Output() changeAuthState = new EventEmitter<AuthState>();
  screenSize$!: Observable<ScreenSize>;

  constructor(public screenService: ScreenService) {
    this.screenSize$ = this.screenService.screenSize$;
  }

  /**
   * Changes the Auth-State to registration form.
   */
  emitStateChange() {
    this.changeAuthState.emit('registration-form');
  }
}
