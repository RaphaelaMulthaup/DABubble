import { Directive, ElementRef, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, Subject, map, startWith, takeUntil } from 'rxjs';

@Directive()
export abstract class BaseSearchDirective implements OnDestroy {
  public searchControl = new FormControl<string>('', { nonNullable: true });
  protected term$!: Observable<string>;
  private _focusListener?: (ev: Event) => void;
  protected destroy$ = new Subject<void>();

  /**
   * Creates and returns a `term$` Observable (startWith, trim).
   */
  protected createTerm$(): Observable<string> {
    this.term$ = this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value),
      map((v) => (v ?? '').trim())
    );
    return this.term$;
  }

  /**
   * Creates a focus-listener for the given element.
   * The callback is called once the element is focused.
   *
   * @param el - the element that should get the foucs-listener
   * @param onFocus - the function called onfocus
   */
  protected setupFocusListener( el: ElementRef<HTMLElement>, onFocus: () => void) {
    if (this._focusListener) {
      try {
        el.nativeElement.removeEventListener('focus', this._focusListener);
      } catch {}
      this._focusListener = undefined;
    }
    this._focusListener = () => onFocus();
    el.nativeElement.addEventListener('focus', this._focusListener);
  }

  /**
   * Subscribes to changes of the search/input term and calls the provided handler on each change.
   * The subscription is automatically unsubscribed when the component/service is destroyed.
   *
   * @param handler - A callback function that receives the updated term as a string whenever it changes.
   */
  protected subscribeToTermChanges(handler: (term: string) => void) {
    if (!this.term$) this.createTerm$();
    this.term$.pipe(takeUntil(this.destroy$)).subscribe(handler);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
