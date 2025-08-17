import { Component, OnInit } from '@angular/core';
import { doc } from '@angular/fire/firestore';

@Component({
  selector: 'app-intro',
  imports: [],
  templateUrl: './intro.component.html',
  styleUrl: './intro.component.scss'
})
export class IntroComponent implements OnInit {

  ngOnInit(): void {
      this.introAnimation();
  }
  
  introAnimation() {
    let logoContainer = document.querySelector(".logo-container");
    this.moveLogo();

    setTimeout(() => {
      logoContainer?.classList.add("container-transperent");
      this.moveUp();
      this.getRid();
    }, 4000);
  }

  moveLogo() {
      let animatedLogo = document.querySelector(".animated-logo");

      setTimeout(() => {
        animatedLogo?.classList.add("expand");
        this.moveSpan();
      }, 1000);
  }

  moveSpan() {
       let animatName = document.querySelector(".animat-name");

       setTimeout(() => {
        animatName?.classList.add("show");
       }, 1000);
  }

  moveUp() {
    let animatedLogo = document.querySelector(".animated-logo");
    animatedLogo?.classList.add("moveUp");
  }

  getRid() {
    let logoContainer = document.querySelector(".logo-container");

    setTimeout(() => {
      logoContainer?.classList.add("getRid");
    }, 2000);
  }

}
