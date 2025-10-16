import { Component, HostListener } from '@angular/core';
import { RouterOutlet, Router, NavigationStart } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OverlayService } from './services/overlay.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'DABubble';

  constructor(
    private authService: AuthService,
    private router: Router,
    private overlayService: OverlayService
  ) {}

  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.overlayService.closeAll();
      }
    });
  }

  // @HostListener('window:beforeunload', ['$event'])
  // onBeforeUnload(event: Event) {
  //   this.authService.logout();
  // }
}
