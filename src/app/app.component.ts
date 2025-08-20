import { Component, DOCUMENT, Inject, inject, Renderer2 } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe, CommonModule } from '@angular/common';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { map, Subscription } from 'rxjs';
import { UserService } from './services/user.service';
import { ChatService } from './services/chat.service';
import { ThreadService } from './services/thread.service';
import { OverlayService } from './services/overlay.service';
import { OverlayComponent } from './overlay/overlay.component';

@Component({
  selector: 'app-root', // Defines the component selector for HTML usage
  imports: [RouterOutlet, AsyncPipe, OverlayComponent, CommonModule], // Imports necessary modules for routing, async operations, overlays, and common features
  templateUrl: './app.component.html', // Path to the component's HTML template
  styleUrl: './app.component.scss', // Path to the component's styling file
})
export class AppComponent {
  /** 
   * Title of the application.
   * This is a static property used to display the name of the app in the UI.
   */
  title = 'DABubble';

  /** 
   * Firestore instance for database access.
   * It is injected to interact with Firestore for database operations.
   */
  firestore: Firestore = inject(Firestore);

  /** 
   * Subscription to observe the visibility of the overlay.
   * It's used to manage the active state of the overlay.
   */
  private sub!: Subscription;

  /** 
   * UserService for handling user-related operations such as authentication, user data, etc.
   * Injected into the component.
   */
  private userService = inject(UserService);

  /** 
   * ChatService for managing chat-related operations such as fetching messages, sending messages, etc.
   * Injected into the component.
   */
  private chatService = inject(ChatService);

  /** 
   * ThreadService for managing thread-related operations.
   * Injected into the component.
   */
  private threadService = inject(ThreadService);

  /** 
   * OverlayService for managing overlays (showing/hiding overlays).
   * Injected into the component.
   */
  public overlayService = inject(OverlayService);

  constructor(
    /** 
     * Renderer2 to safely manipulate the DOM (Document Object Model).
     * Used here for adding/removing classes to HTML elements.
     */
    private renderer: Renderer2,
    
    /** 
     * Injecting the DOCUMENT object to interact with the document's root elements.
     * This is used to add/remove classes based on overlay visibility.
     */
    @Inject(DOCUMENT) private document: Document
  ) {}

  /** 
   * Lifecycle hook that runs when the component is initialized.
   * Subscribes to overlay visibility and updates the DOM based on the overlay's state.
   */
  ngOnInit() {
    // Subscribe to overlay visibility and apply/remove classes based on its state
    this.sub = this.overlayService.overlayDisplayed.subscribe((overlayDisplayed) => {
      const htmlEl = this.document.documentElement;
      const bodyEl = this.document.body;

      if (overlayDisplayed) {
        // If overlay is displayed, add 'overlayActive' class to HTML and body elements
        this.renderer.addClass(htmlEl, 'overlayActive');
        this.renderer.addClass(bodyEl, 'overlayActive');
      } else {
        // If overlay is hidden, remove 'overlayActive' class from HTML and body elements
        this.renderer.removeClass(htmlEl, 'overlayActive');
        this.renderer.removeClass(bodyEl, 'overlayActive');
      }
    });
  }

  /** 
   * Lifecycle hook that runs when the component is destroyed.
   * Unsubscribes from the overlay subscription to prevent memory leaks.
   */
  ngOnDestroy() {
    this.sub.unsubscribe(); // Clean up the subscription
  }
}
