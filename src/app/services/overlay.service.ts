import { Injectable, Type } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

/** 
 * OverlayService is responsible for controlling the visibility and content of an overlay.
 * It provides methods to display and hide overlays, and to manage the overlay component.
 */
@Injectable({
  providedIn: 'root',
})
export class OverlayService {
  /** 
   * A private BehaviorSubject that holds the state (visible or hidden) of the overlay.
   * Initialized with 'false', meaning the overlay is hidden by default.
   */
  private overlaySubject = new BehaviorSubject<boolean>(false);
  
  /** 
   * Observable that other components can subscribe to in order to react to changes in overlay visibility.
   */
  overlayDisplayed = this.overlaySubject.asObservable();
  
  /** 
   * The component to be displayed in the overlay, can be set dynamically.
   * Initially null, meaning no component is displayed.
   */
  overlayComponent: Type<any> | null = null;

  /** 
   * Method to display the overlay with the provided component.
   * Sets the component to be displayed and updates the overlay visibility to 'true'.
   */
  displayOverlay(component: Type<any>) {
    this.overlayComponent = component; // Set the component to be displayed in the overlay
    this.overlaySubject.next(true); // Update the visibility to 'true' (show overlay)
  }

  /** 
   * Method to hide the overlay.
   * Resets the overlay visibility to 'false' and clears the component.
   */
  hideOverlay() {
    this.overlaySubject.next(false); // Set visibility to 'false' (hide overlay)
    this.overlayComponent = null; // Clear the component being displayed
  }
}
