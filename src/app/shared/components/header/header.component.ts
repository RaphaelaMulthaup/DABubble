import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { UserInterface } from '../../models/user.interface';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [AsyncPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);

  currentUser$?: Observable<UserInterface | null>;

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
}
