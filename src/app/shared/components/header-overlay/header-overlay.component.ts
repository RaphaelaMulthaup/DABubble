import { Component, inject, Input } from '@angular/core';
import { OverlayService } from '../../../services/overlay.service';
import { OverlayRef } from '@angular/cdk/overlay';

@Component({
  selector: 'app-header-overlay',
  imports: [],
  templateUrl: './header-overlay.component.html',
  styleUrl: './header-overlay.component.scss',
})
export class HeaderOverlayComponent {
  constructor(public overlayService: OverlayService) {}

  @Input() overlayHeadline: string = '';
  @Input() overlayRef!: OverlayRef;
  @Input() isChannelHeader:boolean = false;
}
