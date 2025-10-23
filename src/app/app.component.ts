import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationStart } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OverlayService } from './services/overlay.service';
import { PresenceService } from './services/presence.service';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'DABubble';
  visibilityTimeout: any;

  constructor(
    private auth: Auth,
    private authService: AuthService,
    private overlayService: OverlayService,
    private presenceService: PresenceService,
    private router: Router
  ) {
    this.handleVisibilityChange();
  }

  ngOnInit() {
    this.handleNavigationEvents();
    this.handleAuthStateChanges();
  }

  /**
   * Closes all overlays whenever a new navigation starts.
   */
  handleNavigationEvents() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) this.overlayService.closeAll();
    });
  }

  /**
   * Subscribes to Firebase authentication state changes and initializes or clears the user's presence accordingly.
   * If a forced close is detected, it triggers the forced logout handler.
   */
  handleAuthStateChanges() {
    onAuthStateChanged(this.auth, async (user) => {
      if (!user) return;
      const forcedClose = await this.presenceService.checkForcedClose(user);
      if (forcedClose) await this.handleForcedClose(user);
      await this.presenceService.initPresence(user);
    });
  }

  /**
   * Handles user logout in case of a forced disconnect.
   * Ensures the user is marked offline and logs out the session.
   * 
   * @param user - The currently authenticated user
   */
  async handleForcedClose(user: User) {
    if (user.isAnonymous) this.authService.setupGuestLogoutOnUnload();
    await this.presenceService.setOffline(user);
    return;
  }

  /**
   * Handles visibility state changes and updates user presence accordingly.
   */
  handleVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
      const user = this.auth.currentUser;
      if (!user) return;
      if (document.visibilityState === 'hidden') {
        this.handleTabHidden(user);
      } else if (document.visibilityState === 'visible') {
        this.handleTabVisible(user);
      }
    });
  }

  /**
   * Sets the user offline after a short delay when the tab is hidden.
   *
   * @param user - The currently authenticated user
   */
  handleTabHidden(user: User) {
    this.visibilityTimeout = setTimeout(async () => {
      await this.presenceService.setOffline(user);
    }, 5000);
  }

  /**
   * Cancels any pending offline action and reinitializes presence when the tab becomes visible.
   *
   * @param user - The currently authenticated user
   */
  handleTabVisible(user: User) {
    clearTimeout(this.visibilityTimeout);
    this.presenceService.initPresence(user);
  }
}
