import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-intro',
  imports: [],
  templateUrl: './intro.component.html',
  styleUrl: './intro.component.scss'
})
export class IntroComponent implements OnInit {
  constructor(){}

  ngOnInit(): void {
      this.introAnimation();
  }

  /**
   * Animation function intro screen
   */
  introAnimation() {
    let logoContainer = document.querySelector(".logo-container");
    this.moveLogo();

    setTimeout(() => {
      logoContainer?.classList.add("container-transperent");
      this.moveUp();
      this.getFinalForm();
    }, 2500);
  }

  /**
   * Moves logo to the left and calls function "moveSpan"
   */
  moveLogo() {
    let animatedLogo = document.querySelector(".animated-logo");
    setTimeout(() => {
      animatedLogo?.classList.add("expand");
      this.moveSpan();
    }, 500);
  }

  /**
   * Name span appers from the left side
   */
  moveSpan() {
    let animatName = document.querySelector(".animat-name");

    setTimeout(() => {
      animatName?.classList.add("show");
    }, 1000);
  }

  /**
   * Moves the now complete logo to the final position
   */
  moveUp() {
    let animatedLogo = document.querySelector(".animated-logo");
    animatedLogo?.classList.add("moveUp");
    animatedLogo?.classList.add("addMargin");

    this.changeColor();
  }

  /**
   * removes the animated logo and makes way for the actual logo
   */
  // getRid() {
  //   let logoContainer = document.querySelector(".logo-container");

  //   setTimeout(() => {
  //     logoContainer?.classList.add("getRid");
  //   }, 700);
  // }

  /**
   * Let logo stay in final position. 
   */
  getFinalForm() {
    let logoContainer = document.querySelector('.logo-container');

    setTimeout(() => {
      logoContainer?.classList.add('logo-container-final');
      logoContainer?.classList.add('final-container');
    }, 1000);
  }

  /**
   * Changes span color from white to black
   */
  changeColor() {
    let name = document.querySelector('.animat-name');
    name?.classList.add('name-black');
  }

}
