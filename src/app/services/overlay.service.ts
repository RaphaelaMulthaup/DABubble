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
} from '@angular/cdk/overlay';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { ChannelInterface } from '../shared/models/channel.interface';
import { Observable, of, Subject, takeUntil } from 'rxjs';
import { UserInterface } from '../shared/models/user.interface';

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
  // /**
  //  * A private BehaviorSubject that holds the state (visible or hidden) of the overlay.
  //  * Initialized with 'false', meaning the overlay is hidden by default.
  //  */
  // private overlaySubject = new BehaviorSubject<boolean>(false);

  // /**
  //  * Observable that other components can subscribe to in order to react to changes in overlay visibility.
  //  */
  // overlayDisplayed = this.overlaySubject.asObservable();

  /**
   * The component to be displayed in the overlay, can be set dynamically.
   * Initially null, meaning no component is displayed.
   */
  overlayComponent: Type<any> | null = null;

  // // /** The headline for the overlay. */
  // // headline: string = '';

  // overlayInputs: Record<string, any> = {};

  private overlayRef?: OverlayRef;
  private overlay: any = inject(Overlay);
  private injector: any = inject(Injector);

  editPostActive: boolean = false;

  constructor() {}

  private overlayInputSubject = new BehaviorSubject<OverlayData | null>(null);
  overlayInput = this.overlayInputSubject.asObservable();

  overlayRefs: OverlayRef[] = [];

  // test to send data from a overlay to another one
  users = signal<UserInterface[]>([]);
  searchReset = signal(false);

  addUser(user: UserInterface) {
    this.users.update((list) => [...list, user]);
  }

  clearUsers() {
    this.users.set([]);
  }

  triggerReset() {
    this.searchReset.set(true);
  }

  clearReset() {
    this.searchReset.set(false);
  }

  openComponent<T extends Object>(
    component: Type<T>,
    backdropType:
      | 'cdk-overlay-dark-backdrop'
      | 'cdk-overlay-transparent-backdrop'
      | null,
    position: {
      origin?: HTMLElement; //the element, the overlay is connected to (leave empty for global overlays)
      originPosition?: {}; //the position of the overlay relative to the connected element (leave empty for global overlays)
      originPositionFallback?: {}; //the position of the overlay, if the originPosition is not possible due to space(leave empty for global overlays)
      globalPosition?: 'center' | 'bottom' | 'belowSearchbar'; //If the overlay is not connected to an element: the parameter whether it is centered or at the bottom of the page (leave empty for overlays connected to an element)
    },
    data?: Partial<T>
  ):
    | {
        ref: ComponentRef<T>;
        overlayRef?: OverlayRef;
        afterClosed$: Observable<void>;
      }
    | undefined {
    // this.close(); // falls schon ein Overlay offen ist

    const destroy$ = new Subject<void>();
    let positionStrategy;
    if (position.origin) {
      positionStrategy = this.overlay
        .position()
        .flexibleConnectedTo(position.origin)
        .withPositions([
          position.originPosition,
          position.originPositionFallback || position.originPosition,
        ]);
    } else if (position.globalPosition === 'bottom') {
      positionStrategy = this.overlay
        .position()
        .global()
        .centerHorizontally()
        .bottom('0px');
      // } else if (position.globalPosition === 'belowSearchbar') {
      //   positionStrategy = this.overlay
      //     .position()
      //     .global()
      //     .top('160px') // Höhe deiner Suchleiste
      //     .left('0')
      //     .right('0')
      //     .bottom('0');
    } else {
      positionStrategy = this.overlay
        .position()
        .global()
        .centerHorizontally()
        .centerVertically();
    }

    if (backdropType === null) {
      this.overlayRef = this.overlay.create({
        positionStrategy,
        hasBackdrop: false,
      });
    } else {
      if (position.globalPosition === 'belowSearchbar') {
        // this.overlayRef = this.overlay.create({
        //   positionStrategy,
        //   hasBackdrop: true,
        //   backdropClass: backdropType,
        //   panelClass: 'search-results-mobile',
        // });
      } else {
        this.overlayRef = this.overlay.create({
          positionStrategy,
          hasBackdrop: true,
          backdropClass: backdropType,
        });
      }
    }

    const portal = new ComponentPortal(component, null, this.injector);
    const componentRef = this.overlayRef?.attach(portal)!;

    this.overlayRef
      ?.backdropClick()
      .pipe(takeUntil(destroy$))
      .subscribe(() => this.close());

    if (data) Object.assign(componentRef.instance, data);

    this.overlayRefs.push(this.overlayRef!);
    if (this.overlayRefs.length > 0) {
      document.body.style.overflow = 'hidden';
    }

    const afterClosed$ = new Subject<void>();

    this.overlayRef
      ?.detachments()
      .pipe(takeUntil(destroy$))
      .subscribe(() => {
        this.overlayRefs = this.overlayRefs.filter(
          (ref) => ref !== this.overlayRef
        );
        if (this.overlayRefs.length == 0) {
          document.body.style.overflow = '';
        }
        afterClosed$.next();
        afterClosed$.complete();
        destroy$.next();
        destroy$.complete();
      });

    return { ref: componentRef, overlayRef: this.overlayRef, afterClosed$ };
  }

  /**
   * closes all overlays
   */
  close(): void {
    this.overlayRefs.forEach((ref) => ref.dispose());
    this.overlayRefs = [];
    document.body.style.overflow = '';
  }

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
}
