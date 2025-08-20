import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Injectable({
  providedIn: 'root',
})
export class OverlayService {
  overlayDisplayed = new BehaviorSubject<boolean>(false);

  displayOverlay() {
    this.overlayDisplayed.next(true);
  }

  hideOverlay() {
    this.overlayDisplayed.next(false);
  }
}
