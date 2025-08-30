import { Component, EventEmitter, Output } from '@angular/core';
import { AuthState } from '../../types/auth-state.type';

@Component({
  selector: 'app-create-account-btn',
  imports: [],
  templateUrl: './create-account-btn.component.html',
  styleUrl: './create-account-btn.component.scss'
})
export class CreateAccountBtnComponent {
  @Output()changeAuthState = new EventEmitter<AuthState>();

  constructor(){}

  emitStateChange() {
    this.changeAuthState.emit('registration-form');
  }
}
