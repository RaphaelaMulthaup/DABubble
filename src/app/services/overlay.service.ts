import { Injectable, Type, Injector, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import {
  Overlay,
  OverlayRef,
  ScrollStrategyOptions,
  PositionStrategy,
  OverlayConfig,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { UserInterface } from '../shared/models/user.interface';
import { OpenComponentResult } from '../shared/models/component.result.interface';
import { OverlayData } from '../shared/models/overlay.data.interface';
import { debounceTime, fromEvent, Subject, takeUntil } from 'rxjs';
import { BackdropType } from '../shared/types/overlay-backdrop.type';
import { OverlayPositionInterface } from '../shared/models/overlay.position.interface';

@Injectable({
  providedIn: 'root',
})
export class OverlayService {
  public overlayComponent: Type<any> | null = null;
  public overlayInputs: Record<string, any> = {};
  public editingPostId = signal<string | null>(null);
  public users = signal<UserInterface[]>([]);
  public searchReset = signal(false);

  private overlayInputSubject = new BehaviorSubject<OverlayData | null>(null);
  public overlayInput = this.overlayInputSubject.asObservable();

  private overlayRef!: OverlayRef;
  private overlayRefs: OverlayRef[] = [];

  constructor(
    private injector: Injector,
    private overlay: Overlay,
    private scrollStrategies: ScrollStrategyOptions
  ) {}

  /**
   * Sets the users in the service (used for updating the users signal).
   *
   * @param users - an array with the users in the users signal
   */
  setUsers(users: UserInterface[]) {
    this.users.set(users);
  }

  /**
   * Method to add a user to the users signal (used for tracking users).
   *
   * @param user - the user to be tracked.
   */
  addUser(user: UserInterface) {
    this.users.update((list) => [...list, user]);
  }

  /**
   * Method to clear the user list (used to reset the users signal).
   */
  clearUsers() {
    this.users.set([]);
  }

  /**
   * Method to trigger a reset for search functionality.
   */
  triggerReset() {
    this.searchReset.set(true);
  }

  /**
   * Method to clear the reset signal.
   */
  clearReset() {
    this.searchReset.set(false);
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
      console.log(1)
    } else {
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
    }
  }

  /**
   * Opens a component inside an overlay with configurable backdrop and positioning options.
   * Returns an `OpenComponentResult` containing the component reference, overlay reference and observables for closure and backdrop clicks, or `undefined` if opening failed.
   *
   * @template T - The component type to be opened.
   * @param component - The component class to render inside the overlay.
   * @param backdropType - Defines the backdrop style: with backdrop (dark/transparent) or without (close-on-scroll/null).
   * @param position - Configuration for overlay placement.
   * @param data - Optional partial data object to assign to the component instance.
   */
  openComponent<T extends Object>(
    component: Type<T>,
    backdropType: BackdropType,
    position: OverlayPositionInterface,
    data?: Partial<T>
  ): OpenComponentResult<T> | undefined {
    const destroy$ = new Subject<void>();
    const backdropClick$ = new Subject<void>();
    const afterClosed$ = new Subject<void>();
    this.overlayRef = this.overlay.create(this.getOverlayConfig(backdropType, this.getPositionStrategy(position)));
    this.overlayRefs.push(this.overlayRef!);
    if (this.overlayRefs.length > 0) this.toggleBodyScroll(true);
    this.handleBackdropClick(this.overlayRef, destroy$, backdropClick$);
    const portal = new ComponentPortal(component, null, this.injector);
    const componentRef = this.overlayRef?.attach(portal)!;
    if (data) Object.assign(componentRef.instance, data);
    this.handleDetach(this.overlayRef, destroy$, afterClosed$, backdropClick$);
    fromEvent(window, 'resize')
      .pipe(debounceTime(150), takeUntil(this.overlayRef.detachments()))
      .subscribe(() => this.closeAll());
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
   * @param position - Configuration for overlay placement.
   */
  private getPositionStrategy(position: OverlayPositionInterface) {
    if (position.origin) {
      return this.getOriginPositionStrategy(position);
    } else if (position.globalPosition === 'bottom') {
      return this.getBottomPositionStrategy();
    } else return this.getCenterPositionStrategy();
  }

  /**
   * This function sets the positionStrategy for an overlay that is connected to an origin.
   *
   * @param position - Configuration for overlay placement.
   */
  private getOriginPositionStrategy(position: OverlayPositionInterface) {
    return this.overlay
      .position()
      .flexibleConnectedTo(position.origin!)
      .withPositions([
        position.originPosition!,
        position.originPositionFallback || position.originPosition!,
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
    backdropType: BackdropType,
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
   * Closes all open overlays
   */
  closeAll() {
    this.overlayRefs.forEach((ref) => ref.dispose());
    this.overlayRefs = [];
    this.toggleBodyScroll(false);
  }

  /**
   * Closes a specific overlay by its reference.
   * @param ref The reference to the overlay to be closed.
   */
  closeOne(ref: OverlayRef) {
    const index = this.overlayRefs.indexOf(ref);
    if (index !== -1) {
      ref.dispose();
      this.overlayRefs.splice(index, 1);
    }
    if (this.overlayRefs.length === 0) this.toggleBodyScroll(false);
  }
}
