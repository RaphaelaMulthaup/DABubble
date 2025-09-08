import { Component, DOCUMENT, Inject, inject, Renderer2 } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe, CommonModule } from '@angular/common';
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  getDocs,
  setDoc,
} from '@angular/fire/firestore';
import { map, Subscription } from 'rxjs';
import { UserService } from './services/user.service';
import { ChatService } from './services/chat.service';
import { OverlayService } from './services/overlay.service';

@Component({
  selector: 'app-root', // Defines the component selector for HTML usage
  imports: [RouterOutlet, AsyncPipe, CommonModule], // Imports necessary modules for routing, async operations, overlays, and common features
  templateUrl: './app.component.html', // Path to the component's HTML template
  styleUrl: './app.component.scss', // Path to the component's styling file
})
export class AppComponent {
  /**
   * Title of the application.
   * This is a static property used to display the name of the app in the UI.
   */
  title = 'DABubble';
  constructor(
    /**
     * Firestore instance for database access.
     * It is injected to interact with Firestore for database operations.
     */
    firestore: Firestore
  ) {}
}
