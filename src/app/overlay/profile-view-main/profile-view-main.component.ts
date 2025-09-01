import { Component, inject } from '@angular/core';
import { OverlayService } from '../../services/overlay.service';

@Component({
  selector: 'app-profile-view-main',
  imports: [],
  templateUrl: './profile-view-main.component.html',
  styleUrl: './profile-view-main.component.scss'
})
export class ProfileViewMainComponent {
  overlayService = inject(OverlayService);
}
