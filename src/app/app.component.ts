import { Component} from '@angular/core';
import { RouterOutlet, Router, NavigationStart } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OverlayService } from './services/overlay.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss', 
})
export class AppComponent {
  title = 'DABubble';

  constructor(
    private router: Router,
    private overlayService: OverlayService,
  ) {}

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.overlayService.closeAll();
      }
    });
  }
}
