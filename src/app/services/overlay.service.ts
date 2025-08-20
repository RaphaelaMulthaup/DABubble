import { Injectable, Type } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Injectable({
  providedIn: 'root',
})
export class OverlayService {
  private overlaySubject = new BehaviorSubject<boolean>(false);
  overlayDisplayed = this.overlaySubject.asObservable();
  overlayComponent: Type<any> | null = null;

  displayOverlay(component: Type<any>) {
    this.overlayComponent = component;
    this.overlaySubject.next(true);
  }

  hideOverlay() {
    this.overlaySubject.next(false);
    this.overlayComponent = null;
  }
}
