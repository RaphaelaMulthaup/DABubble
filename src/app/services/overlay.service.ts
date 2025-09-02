import { inject, Injectable, Type, TemplateRef, ViewContainerRef, Injector, ComponentRef } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { ChannelInterface } from '../shared/models/channel.interface';
import { Observable, of } from 'rxjs';


// here you kann add more interface to send data when the overlay is open.
export interface OverlayData {
  channel?: Observable<ChannelInterface | undefined>;
}

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

  /** The headline for the overlay. */
  headline: string = '';

  overlayInputs: Record<string, any> = {};

  private overlayRef?: OverlayRef;
  private overlay: any = inject(Overlay);
  private injector: any = inject(Injector);

  constructor() { }

  private overlayInputSubject = new BehaviorSubject<OverlayData | null>(null);
  overlayInput = this.overlayInputSubject.asObservable();

  setOverlayInputs(data: OverlayData) {
    this.overlayInputSubject.next(data);
  }

  /**
   * Method to display the overlay with the provided component and associated headline.
   * Sets the component to be displayed and updates the overlay visibility to 'true'.
   */
  displayOverlay(component: Type<any>, headline: string, inputs?: Record<string, any>) {
    this.headline = headline;
    this.overlayComponent = component; // Set the component to be displayed in the overlay
    this.overlayInputs = inputs || {};
    this.overlaySubject.next(true); // Update the visibility to 'true' (show overlay)
  }

  /**
   * Method to hide the overlay.
   * Resets the overlay visibility to 'false' and clears the component.
   */
  hideOverlay() {
    this.overlaySubject.next(false); // Set visibility to 'false' (hide overlay)
    this.overlayComponent = null; // Clear the component being displayed
    this.overlayInputs = {};
  }

  /**
 * Prüfen, ob Overlay aktuell offen ist
 */
  isOpen(): boolean {
    return !!this.overlayRef;
  }

  openComponent<T extends Object>(
    component: Type<T>,
    backdropType: 'cdk-overlay-dark-backdrop' | 'cdk-overlay-transparent-backdrop' | null,
    position: {
      origin?: HTMLElement,                 //the element, the overlay is connected to (leave empty for global overlays)
      originPosition?: {},                  //the position of the overlay relative to the connected element (leave empty for global overlays)
      originPositionFallback?: {},          //the position of the overlay, if the originPosition is not possible due to space(leave empty for global overlays)
      globalPosition?: 'center' | 'bottom'  //If the overlay is not connected to an element: the parameter whether it is centered or at the bottom of the page (leave empty for overlays connected to an element)
    },
    data?: Partial<T>,

  ): ComponentRef<T> | undefined {
    this.close(); // falls schon ein Overlay offen ist

    let positionStrategy;
    if (position.origin) {
      positionStrategy = this.overlay.position()
        .flexibleConnectedTo(position.origin)
        .withPositions([
          position.originPosition,
          position.originPositionFallback || position.originPosition
        ]);
    } else if (position.globalPosition === 'bottom') {
      positionStrategy = this.overlay.position()
        .global()
        .centerHorizontally()
        .bottom('0px');
    } else {
      positionStrategy = this.overlay.position()
        .global()
        .centerHorizontally()
        .centerVertically();
    }

    if (backdropType === null) {
      this.overlayRef = this.overlay.create({
        positionStrategy,
        hasBackdrop: false
      });
    } else {
      this.overlayRef = this.overlay.create({
        positionStrategy,
        hasBackdrop: true,
        backdropClass: backdropType
      });
    }

    const portal = new ComponentPortal(component, null, this.injector);
    const componentRef = this.overlayRef?.attach(portal)!;

    // Body scroll sperren
    document.body.style.overflow = 'hidden';

    // Klick außerhalb schließt Overlay
    this.overlayRef?.backdropClick().subscribe(() => this.close());

    if (data) Object.assign(componentRef.instance, data);

    return componentRef;
  }

  /**
   * closes an overlay
   */
  close(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;

      // Body scroll wieder freigeben
      document.body.style.overflow = '';
    }
  }
}
