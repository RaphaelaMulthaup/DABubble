import { OverlayRef } from '@angular/cdk/overlay';
import { ComponentRef } from '@angular/core';
import { Observable } from 'rxjs';

export interface OpenComponentResult<T> {
  ref: ComponentRef<T>;
  overlayRef: OverlayRef;
  afterClosed$: Observable<void>;
  backdropClick$: Observable<void>;
}
