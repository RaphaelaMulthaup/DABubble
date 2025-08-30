import { Component } from '@angular/core';

@Component({
  selector: 'app-header-outside-dashboard',
  imports: [],
  templateUrl: './header-outside-dashboard.component.html',
  styleUrl: './header-outside-dashboard.component.scss'
})
export class HeaderOutsideDashboardComponent {
  ngOnInit(): void {
    //wenn noch nicht eingeloggt
    setTimeout(() => {
      this.showFinalLogo();
    }, 5600);
  }

  /**
   * Shows Logo in the final position of the intro animation
   */
  showFinalLogo() {
    let finalLogo = document.querySelector('.logo-final');
    finalLogo?.classList.add('showLogo');
  }
}
