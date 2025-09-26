import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-header-outside-dashboard',
  imports: [],
  templateUrl: './header-outside-dashboard.component.html',
  styleUrl: './header-outside-dashboard.component.scss'
})
export class HeaderOutsideDashboardComponent {  
  @Input() context!: string;

  /**
   * Detects context and shows logo matching to intro animation in "non-auth"
   */
  ngOnInit(): void {
    if (this.context === 'non-auth') {
      setTimeout(() => {
        this.showFinalLogo();
      }, 5600);
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
}
