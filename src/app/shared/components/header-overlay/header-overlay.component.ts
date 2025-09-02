import { Component, inject, Input } from '@angular/core';
import { OverlayService } from '../../../services/overlay.service';

@Component({
  selector: 'app-header-overlay',
  imports: [],
  templateUrl: './header-overlay.component.html',
  styleUrl: './header-overlay.component.scss'
})
export class HeaderOverlayComponent {
  overlayService = inject(OverlayService);

  @Input() overlayHeadline: string = '';
}
