import { Component, OnInit } from '@angular/core';
import { CreateAccountBtnComponent } from '../create-account-btn/create-account-btn.component';

@Component({
  selector: 'app-header',
  imports: [CreateAccountBtnComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit{

  ngOnInit(): void {
      setTimeout(() => {
        this.showFinalLogo();
      }, 5600);
  }


/**
 * Shows Logo in the final position of the intro animation
 */
  showFinalLogo() {
    let finalLogo = document.querySelector('.logoFinal');
    finalLogo?.classList.add('showLogo');
  }

}
