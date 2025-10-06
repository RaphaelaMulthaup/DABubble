import { ConnectedPosition } from "@angular/cdk/overlay";

export interface OverlayPositionInterface {
  origin?: HTMLElement;                         // The element to which the overlay is connected (leave empty for global overlays).
  originPosition?: ConnectedPosition;           // The position of the overlay relative to the connected element (leave empty for global overlays).
  originPositionFallback?: ConnectedPosition;   // Fallback position if originPosition is not possible (leave empty for global overlays or if there is no fallback-position).
  globalPosition?: 'center' | 'bottom';         // Position for global overlays (leave empty overlays connected to an element).
}
