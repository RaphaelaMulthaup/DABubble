import {
  inject,
  Injectable,
  Type,
  TemplateRef,
  ViewContainerRef,
  Injector,
  ComponentRef,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy,
  ConnectedPosition,
} from '@angular/cdk/overlay';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { ChannelInterface } from '../shared/models/channel.interface';
import { Observable, of, Subject, takeUntil } from 'rxjs';
import { UserInterface } from '../shared/models/user.interface';

// Interface to allow sending data when the overlay is opened.
export interface OverlayData {
  channel?: Observable<ChannelInterface | undefined>;
}
// Represents the result of opening an component in an overlay, including its reference, overlay, and observables for closing and backdrop clicks.
export interface OpenComponentResult<T> {
  ref: ComponentRef<T>;
  overlayRef: OverlayRef;
  afterClosed$: Observable<void>;
  backdropClick$: Observable<void>;
}

/**
 * OverlayService is responsible for controlling the visibility and content of an overlay.
 * It provides methods to display and hide overlays, and to manage the overlay component.
 */
@Injectable({
  providedIn: 'root',
})
export class OverlayService {
  // The component to be displayed in the overlay, can be set dynamically.
  // Initially null, meaning no component is displayed.
  overlayComponent: Type<any> | null = null;

  // Object to store inputs for the overlay component (currently not used in this code).
  overlayInputs: Record<string, any> = {};

  private overlayRef!: OverlayRef;

  // Reactive signal to store the ID of the post currently being edited.
  public editingPostId = signal<string | null>(null);

  // Subject to handle overlay input data.
  private overlayInputSubject = new BehaviorSubject<OverlayData | null>(null);
  overlayInput = this.overlayInputSubject.asObservable();

  // Store references to all open overlays.
  overlayRefs: OverlayRef[] = [];

  // Test signals for sending user data between overlays.
  users = signal<UserInterface[]>([]);
  searchReset = signal(false);

  constructor(private overlay: Overlay, private injector: Injector) {}

  // Method to add a user to the users signal (used for tracking users).
  addUser(user: UserInterface) {
    this.users.update((list) => [...list, user]);
  }

  // Method to clear the user list (used to reset the users signal).
  clearUsers() {
    this.users.set([]);
  }

  // Method to trigger a reset for search functionality.
  triggerReset() {
    this.searchReset.set(true);
  }

  // Method to clear the reset signal.
  clearReset() {
    this.searchReset.set(false);
  }

/**
   * Opens a component inside an overlay with configurable backdrop and positioning options.
   * 
   * @template T - The component type to be opened.
   * @param component - The component class to render inside the overlay.
   * @param backdropType - Defines the backdrop style (`dark`, `transparent`) or disables it (`null`).
   * @param position - Configuration for overlay placement:
   *   - `origin`: The HTML element the overlay is connected to (optional).
   *   - `originPosition`: Preferred position relative to the origin (optional).
   *   - `originPositionFallback`: Fallback position if the preferred one is not possible (optional).
   *   - `globalPosition`: Global positioning when not connected to an element (`center` or `bottom`).
   * @param data - Optional partial data object to assign to the component instance.
   * @returns An `OpenComponentResult` containing the component reference, overlay reference,
   *          and observables for closure and backdrop clicks, or `undefined` if opening failed.
   */  openComponent<T extends Object>(
    component: Type<T>,
    backdropType:
      | 'cdk-overlay-dark-backdrop'
      | 'cdk-overlay-transparent-backdrop'
      | null,
    position: {
      origin?: HTMLElement; // The element to which the overlay is connected (leave empty for global overlays).
      originPosition?: ConnectedPosition; // The position of the overlay relative to the connected element.
      originPositionFallback?: ConnectedPosition; // Fallback position if originPosition is not possible.
      globalPosition?: 'center' | 'bottom'; // Position if the overlay is not connected to an element (center or bottom).
    },
    data?: Partial<T>
  ): OpenComponentResult<T> | undefined {
    const destroy$ = new Subject<void>();
    const   backdropClickSubject = new Subject<void>();

    let positionStrategy;

    // Determine position strategy based on whether the overlay is connected to an element or is global.
    if (position.origin) {
      positionStrategy = this.overlay
        .position()
        .flexibleConnectedTo(position.origin)
        .withPositions([
          position.originPosition!,
          position.originPositionFallback || position.originPosition!,
        ]);
    } else if (position.globalPosition === 'bottom') {
      positionStrategy = this.overlay
        .position()
        .global()
        .centerHorizontally()
        .bottom('0px');
    } else {
      positionStrategy = this.overlay
        .position()
        .global()
        .centerHorizontally()
        .centerVertically();
    }

    // Create the overlay with or without a backdrop depending on the backdropType.
    if (backdropType === null) {
      this.overlayRef = this.overlay.create({
        positionStrategy,
        hasBackdrop: false,
      });
    } else {
      this.overlayRef = this.overlay.create({
        positionStrategy,
        hasBackdrop: true,
        backdropClass: backdropType,
      });
    }

    // Store the reference of the open overlay.
    this.overlayRefs.push(this.overlayRef!);
    if (this.overlayRefs.length > 0) {
      document.body.style.overflow = 'hidden';
    }

    // Close the overlay when the backdrop is clicked.
    this.overlayRef
      .backdropClick()
      .pipe(takeUntil(destroy$))
      .subscribe(() => {
        backdropClickSubject.next();
        this.closeAll();
      });

    // Create a portal for the component to be rendered in the overlay.
    const portal = new ComponentPortal(component, null, this.injector);
    const componentRef = this.overlayRef?.attach(portal)!;

    // Pass any data to the component if provided.
    if (data) Object.assign(componentRef.instance, data);

    const afterClosed$ = new Subject<void>();

    // Clean up the overlay after it is closed.
    this.overlayRef
      ?.detachments()
      .pipe(takeUntil(destroy$))
      .subscribe(() => {
        this.overlayRefs = this.overlayRefs.filter(
          (ref) => ref !== this.overlayRef
        );
        if (this.overlayRefs.length === 0) {
          document.body.style.overflow = '';
        }
        afterClosed$.next();
        afterClosed$.complete();
        backdropClickSubject.complete();
        destroy$.next();
        destroy$.complete();
      });

    return {
      ref: componentRef,
      overlayRef: this.overlayRef,
      afterClosed$,
      backdropClick$: backdropClickSubject.asObservable(),
    };
  }

  /**
   * Closes all open overlays.
   */
  closeAll(): void {
    this.overlayRefs.forEach((ref) => ref.dispose());
    this.overlayRefs = [];
    document.body.style.overflow = '';
  }

  /**
   * Closes a specific overlay by its reference.
   * @param ref The reference to the overlay to be closed.
   */
  closeOne(ref: OverlayRef): void {
    const index = this.overlayRefs.indexOf(ref);
    if (index !== -1) {
      ref.dispose();
      this.overlayRefs.splice(index, 1);
    }

    if (this.overlayRefs.length === 0) {
      document.body.style.overflow = '';
    }
  }

  // Sets the users in the service (used for updating the users signal).
  setUsers(users: UserInterface[]): void {
    this.users.set(users);
  }
}
