import { Directive, ElementRef, EventEmitter, Host, HostListener, Output} from '@angular/core';

@Directive({
  selector: '[appRectangleDragClose]'
})
export class RectangleDragCloseDirective {
 
  private startY = 0;
  @Output() dragClose = new EventEmitter<void>();
  constructor(private el: ElementRef) { }

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  onStart(event: MouseEvent | TouchEvent){
    this.startY = this.getY(event);
  }


  @HostListener('mouseup', ['$event'])
  @HostListener('touchend', ['$event'])
  onEnd(event: MouseEvent | TouchEvent) {
    const endY = this.getY(event);
    if (endY - this.startY > 50) {
      this.dragClose.emit();
    }
  }


    private getY(event: MouseEvent | TouchEvent): number {
    return event instanceof MouseEvent
      ? event.clientY
      : event.changedTouches[0].clientY;
  }
}
