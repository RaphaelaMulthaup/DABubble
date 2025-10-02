import { Directive, ElementRef, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, Subject, map, startWith, takeUntil } from 'rxjs';

/**
 * Abstrakte, wiederverwendbare Basis-Directive für Such-Inputs.
 * - Stellt `searchControl`, `term$` und `destroy$` bereit
 * - Hilfsmethoden: createTerm$, setupFocusListener, subscribeToTermChanges
 *
 * Variante A: Overlay- und darstellungs-spezifische Logik bleibt in den konkreten Komponenten.
 */
@Directive()
export abstract class BaseSearchDirective implements OnDestroy {
  /** FormControl, das in allen Suchkomponenten genutzt wird */
  public searchControl = new FormControl<string>('', { nonNullable: true });

  /** Observable der getrimmten Suchbegriffe (initialisiert durch createTerm$) */
  protected term$!: Observable<string>;

  /** destroy-Subject für unsubscribe */
  protected destroy$ = new Subject<void>();

  private _focusListener?: (ev: Event) => void;

  /**
   * Erzeugt das `term$` Observable (startWith, trim).
   * Gibt das Observable zurück und schreibt es in `this.term$`.
   */
  protected createTerm$(): Observable<string> {
    this.term$ = this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value),
      map((v) => (v ?? '').trim()),
    );
    return this.term$;
  }

  /**
   * Richtet einen Fokus-Listener für das übergebene Element ein.
   * Der Callback wird aufgerufen, wenn das Element fokussiert wird.
   *
   * Wichtig: Rufe diese Methode in der concrete Komponente in `ngOnInit`
   * nachdem dein ViewChild (ElementRef) verfügbar ist.
   */
  protected setupFocusListener(
    el: ElementRef<HTMLElement>,
    onFocus: () => void
  ): void {
    // Entferne evtl. alten Listener
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
   * Convenience: subscribeToTermChanges(handler) abonniert `term$` und
   * führt handler(term) für jeden Wert aus. Das Abo wird automatisch
   * mit destroy$ beendet.
   */
  protected subscribeToTermChanges(handler: (term: string) => void) {
    if (!this.term$) this.createTerm$();
    this.term$.pipe(takeUntil(this.destroy$)).subscribe(handler);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
