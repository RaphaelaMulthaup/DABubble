import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Injectable({
  providedIn: 'root',
})
export class OverlayService {
  overlayDisplayed = new BehaviorSubject<boolean>(false);
  constructor(private router: Router) {}

  displayOverlay(subRoute: string) {
    this.overlayDisplayed.next(true);
    this.router.navigate([{ outlets: { overlay: ['overlay', subRoute] } }]);
  }

  hideOverlay() {
    this.overlayDisplayed.next(false);
  this.router.navigate([{ outlets: { overlay: null } }]);   }
}
