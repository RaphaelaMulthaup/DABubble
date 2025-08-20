import { Component, inject } from '@angular/core';
import { OverlayService } from '../services/overlay.service';
import { RouterOutlet } from '@angular/router';
import { NgIf, NgComponentOutlet, AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-overlay',
  imports: [RouterOutlet, NgIf, NgComponentOutlet, AsyncPipe],
  templateUrl: './overlay.component.html',
  styleUrl: './overlay.component.scss',
})
export class OverlayComponent {
  // Inject OverlayService to handle the overlays
  public overlayService = inject(OverlayService);
}
