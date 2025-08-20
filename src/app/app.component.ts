import { Component, DOCUMENT, Inject, inject, Renderer2 } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { map, Subscription } from 'rxjs';
import { UserService } from './services/user.service';
import { ChatService } from './services/chat.service';
import { ThreadService } from './services/thread.service';
import { OverlayService } from './services/overlay.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  // Title of the application
  title = 'DABubble';

  // Firestore instance for database access
  firestore: Firestore = inject(Firestore);
  private sub!: Subscription;

  // Service to manage user-related operations
  private userService = inject(UserService);

  // Service to manage chat-related operations
  private chatService = inject(ChatService);

  // Service to manage thread-related operations
  private threadService = inject(ThreadService);

  // Service to handle overlays
  private overlayService = inject(OverlayService);

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  // Lifecycle hook that runs when the component is initialized
  ngOnInit() {
    this.sub = this.overlayService.overlayDisplayed.subscribe((overlayDisplayed) => {
      const htmlEl = this.document.documentElement;
      const bodyEl = this.document.body;

      if (overlayDisplayed) {
        this.renderer.addClass(htmlEl, 'overlayActive');
        this.renderer.addClass(bodyEl, 'overlayActive');
      } else {
        this.renderer.removeClass(htmlEl, 'overlayActive');
        this.renderer.removeClass(bodyEl, 'overlayActive');
      }
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
