import { inject, Injectable, Type, TemplateRef, ViewContainerRef, Injector, ComponentRef } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';

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

  openComponent<T>(origin: HTMLElement, component: Type<T>): ComponentRef<T> | undefined {
    this.close(); // falls schon ein Overlay offen ist

    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(origin)
      .withPositions([
        { originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'top' },
        { originX: 'start', originY: 'top', overlayX: 'end', overlayY: 'top' }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop' // bzw 'cdk-overlay-transparent-backdrop' für transparentes
    });

    const portal = new ComponentPortal(component, null, this.injector);
    const componentRef = this.overlayRef?.attach(portal);

    // Body scroll sperren
    document.body.style.overflow = 'hidden';

    // Klick außerhalb schließt Overlay
    this.overlayRef?.backdropClick().subscribe(() => this.close());

    return componentRef;
  }

  /**
   * Overlay schließen
   */
  close(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;

      // Body scroll wieder freigeben
      document.body.style.overflow = '';
    }
  }

  /**
   * Prüfen, ob Overlay aktuell offen ist
   */
  isOpen(): boolean {
    return !!this.overlayRef;
  }
}
