import { Component} from '@angular/core';
import { RouterOutlet, Router, NavigationStart } from '@angular/router';
import { AsyncPipe, CommonModule } from '@angular/common';
import { OverlayService } from './services/overlay.service';

/**
 * The root component of the Angular application.
 * Manages routing, overlays, and other global behaviors.
 */
@Component({
  selector: 'app-root', // Defines the component selector for HTML usage
  imports: [RouterOutlet, AsyncPipe, CommonModule], // Imports necessary modules for routing, async operations, overlays, and common features
  templateUrl: './app.component.html', // Path to the component's HTML template
  styleUrl: './app.component.scss', // Path to the component's styling file
})
export class AppComponent {
  /**
   * The title of the application.
   * This property holds the app's name and is used for UI display.
   */
  title = 'DABubble';

  /**
   * Constructor that initializes the services required by the component.
   * @param router - The router service to manage application navigation.
   * @param overlayService - The overlay service to manage UI overlays (e.g., modals, popups).
   */
  constructor(
    private router: Router, // Router service to handle navigation events
    private overlayService: OverlayService, // Overlay service to handle overlays
  ) {}

  /**
   * Angular lifecycle hook that is called when the component is initialized.
   * Here, we subscribe to router events to close all overlays before navigation.
   */
  ngOnInit(): void {
    // Subscribe to Router events to listen for navigation start events
    this.router.events.subscribe((event) => {
      // If the event is a NavigationStart event (indicating navigation is starting)
      if (event instanceof NavigationStart) {
        // Call closeAll method of overlay service to close all active overlays before navigating
        this.overlayService.closeAll();
      }
    });
  }
}
