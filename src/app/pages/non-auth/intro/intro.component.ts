import { Component, OnInit } from '@angular/core';
import { count } from '@angular/fire/firestore';

@Component({
  selector: 'app-intro',
  imports: [],
  templateUrl: './intro.component.html',
  styleUrl: './intro.component.scss',
})
export class IntroComponent implements OnInit {
  introPlayed: boolean = false;

  constructor() {}

  ngOnInit() {
    const introPlayedStorage = localStorage.getItem('introPlayed');
    this.introPlayed = introPlayedStorage === 'true';

    this.decideLogo();
  }

  decideLogo() {
    let logo = document.querySelector('.logo-container');
    let noIntro = document.querySelector('.noIntro-container');

    if (this.introPlayed) {
      logo?.classList.add('hide-animation');
      noIntro?.classList.add('show-noIntro');
    } else {
      this.introAnimation();
      localStorage.setItem('introPlayed', 'true');
    }
  }

  /**
   * Handles intro-animation
   */
  introAnimation() {
    this.animationBlockFirst();
    this.animationBlockSecond();
  }

  /**
   * Handles first animation functions
   */
  animationBlockFirst() {
    setTimeout(() => {
      this.moveLogo();
    }, 500);

    setTimeout(() => {
      this.moveSpan();
    }, 1500);

    setTimeout(() => {
      this.changeColor();
    }, 3500);
  }

  /**
   * Handles following animation functions
   */
  animationBlockSecond() {
    let logoContainer = document.querySelector('.logo-container');

    setTimeout(() => {
      logoContainer?.classList.add('container-transperent');
      this.addMaxWidth();
    }, 3500);

    setTimeout(() => {
      this.moveUp();
    }, 3500);
    
    setTimeout(() => {
      this.finalForm();
    }, 5000);
  }

  /**
   * Moves logo aside and generates space for name span
   */
  moveLogo() {
    let animatedLogo = document.querySelector('.animated-logo');
    animatedLogo?.classList.add('expand');
  }

  /**
   * Moves span from left in place
   */
  moveSpan() {
    let animatName = document.querySelector('.animat-name');
    animatName?.classList.add('show');
  }

  /**
   * Changes name span color for final apperence
   */
  changeColor() {
    let animatName = document.querySelector('.animat-name');
    animatName?.classList.add('name-black');
  }

  /**
   * Moves logo&span to the final position
   */
  moveUp() {
    let animatedLogo = document.querySelector('.animated-logo');

    animatedLogo?.classList.add('moveUp');
    animatedLogo?.classList.add('addMargin');
  }

  /**
   * Adds max width 
   */
  addMaxWidth() {
    let logoContainer = document.querySelector('.logo-container');
    logoContainer?.classList.add('addMaxWidth');
  }

  /**
   * Adds final apperence of logo&span. Size fits final form.
   */
  finalForm() {
    let logoContainer = document.querySelector('.logo-container');

    logoContainer?.classList.add('logo-container-final');
    logoContainer?.classList.add('final-container');
  }
}
