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
  ScrollStrategyOptions,
  PositionStrategy,
  OverlayConfig,
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

  constructor(
    private overlay: Overlay,
    private injector: Injector,
    private scrollStrategies: ScrollStrategyOptions
  ) {}

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
   *   - `globalPosition`: Global positioning when not connected to an element (`center` or `bottom`) (optional).
   * @param data - Optional partial data object to assign to the component instance.
   * @returns An `OpenComponentResult` containing the component reference, overlay reference,
   *          and observables for closure and backdrop clicks, or `undefined` if opening failed.
   */ openComponent<T extends Object>(
    component: Type<T>,
    backdropType:
      | 'cdk-overlay-dark-backdrop'
      | 'cdk-overlay-transparent-backdrop'
      | 'close-on-scroll'
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
    const backdropClick$ = new Subject<void>();
    const afterClosed$ = new Subject<void>();

    this.overlayRef = this.overlay.create(
      this.getOverlayConfig(backdropType, this.getPositionStrategy(position))
    );

    this.overlayRefs.push(this.overlayRef!);
    if (this.overlayRefs.length > 0) this.toggleBodyScroll(true);

    this.handleBackdropClick(this.overlayRef, destroy$, backdropClick$);
    const portal = new ComponentPortal(component, null, this.injector);
    const componentRef = this.overlayRef?.attach(portal)!;
    if (data) Object.assign(componentRef.instance, data);
    
    this.handleDetach(this.overlayRef, destroy$, afterClosed$, backdropClick$);
    return {
      ref: componentRef,
      overlayRef: this.overlayRef,
      afterClosed$,
      backdropClick$: backdropClick$.asObservable(),
    };
  }

  /**
   * This function determines the position strategy of the overlay based on whether it is connected to an element or is at the bottom or global.
   *
   * @param position - Configuration for overlay placement
   */
  private getPositionStrategy(position: {
    origin?: HTMLElement;
    originPosition?: ConnectedPosition;
    originPositionFallback?: ConnectedPosition;
    globalPosition?: 'center' | 'bottom';
  }) {
    if (position.origin) {
      return this.getOriginPositionStrategy(
        position.origin,
        position.originPosition!,
        position.originPositionFallback
      );
    } else if (position.globalPosition === 'bottom') {
      return this.getBottomPositionStrategy();
    } else return this.getCenterPositionStrategy();
  }

  /**
   * This function sets the positionStrategy for an overlay that is connected to an origin.
   *
   * @param origin - The HTML element the overlay is connected to
   * @param originPosition - Preferred position relative to the origin
   * @param originPositionFallback -  Fallback position if the preferred one is not possible (optional)
   */
  private getOriginPositionStrategy(
    origin: HTMLElement,
    originPosition: ConnectedPosition,
    originPositionFallback?: ConnectedPosition
  ) {
    return this.overlay
      .position()
      .flexibleConnectedTo(origin)
      .withPositions([
        originPosition,
        originPositionFallback || originPosition,
      ]);
  }

  /**
   * This function sets the positionStrategy for an overlay that is placed at the bottom of the page.
   */
  private getBottomPositionStrategy() {
    return this.overlay.position().global().centerHorizontally().bottom('0px');
  }

  /**
   * This function sets the positionStrategy for an overlay that is centered.
   */
  private getCenterPositionStrategy() {
    return this.overlay
      .position()
      .global()
      .centerHorizontally()
      .centerVertically();
  }

  /**
   * This function sets the overlayRefs configuration (backdrop and positionStrategy).
   * The overlay can either have a backdrop (dark or transparent) or not (with or without close-on-scroll).
   *
   * @param backdropType - Defines the backdrop style (`dark`, `transparent`) or disables it (`null`).
   * @param positionStrategy - the positionStrategy returned from the getPositionStrategy()-function
   */ 
  private getOverlayConfig(
    backdropType: string | null,
    positionStrategy: PositionStrategy
  ): OverlayConfig {
    if (backdropType === null) {
      return { positionStrategy, hasBackdrop: false };
    } else if (backdropType === 'close-on-scroll') {
      return {
        positionStrategy,
        hasBackdrop: false,
        scrollStrategy: this.scrollStrategies.close(),
      };
    } else {
      return {
        positionStrategy,
        hasBackdrop: true,
        backdropClass: backdropType,
      };
    }
  }

  /**
   * This function locks the body-scroll, when an overlay is open and adjusts the body-style accordingly.
   *
   * @param lock - whether the body scroll should be locked or not
   */
  private toggleBodyScroll(lock: boolean) {
    if (lock) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
    }
  }

  /**
   * This function closes all overlays, when the backdrop is clicked.
   *
   * @param overlayRef - the overlay reference that was created
   * @param destroy$ - the subject that triggers cleanup and unsubscribes from observables
   * @param backdropClick$ - the subject that handles backdrop-clicks
   */
  private handleBackdropClick(
    overlayRef: OverlayRef,
    destroy$: Subject<void>,
    backdropClick$: Subject<void>
  ) {
    overlayRef
      .backdropClick()
      .pipe(takeUntil(destroy$))
      .subscribe(() => {
        backdropClick$.next();
        this.closeAll();
      });
  }

  /**
   * This function handles the cleanup when an overlay is detached.
   * It removes the overlay from the internal list and restores body scroll styles if no overlays are left
   * It completes all related subjects to avoid memory leaks.
   *
   * @param overlayRef - the overlay reference that was created and may be detached
   * @param destroy$ - the subject that triggers cleanup and unsubscribes from observables
   * @param afterClosed$ - the subject that emits when the overlay has been fully closed
   * @param backdropClick$ - the subject that handles backdrop clicks
   */
  private handleDetach(
    overlayRef: OverlayRef | undefined,
    destroy$: Subject<void>,
    afterClosed$: Subject<void>,
    backdropClick$: Subject<void>
  ) {
    overlayRef
      ?.detachments()
      .pipe(takeUntil(destroy$))
      .subscribe(() => {
        this.overlayRefs = this.overlayRefs.filter((ref) => ref !== overlayRef);
        if (this.overlayRefs.length === 0) this.toggleBodyScroll(false);
        afterClosed$.next();
        afterClosed$.complete();
        backdropClick$.complete();
        destroy$.next();
        destroy$.complete();
      });
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
