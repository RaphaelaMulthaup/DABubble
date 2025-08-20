import { Component, inject } from '@angular/core';
import { OverlayService } from '../services/overlay.service';

@Component({
  selector: 'app-overlay',
  imports: [],
  templateUrl: './overlay.component.html',
  styleUrl: './overlay.component.scss'
})
export class OverlayComponent {
  // Inject OverlayService to handle the overlays
  public overlayService = inject(OverlayService);

}
