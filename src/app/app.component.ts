import { Component} from '@angular/core';
import { RouterOutlet, Router, NavigationStart } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OverlayService } from './services/overlay.service';
import { PresenceService } from './services/presence.service';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { AuthService } from './services/auth.service';
import { doc } from '@angular/fire/firestore';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'DABubble';
  private visibilityTimeout: any;

  constructor(
    private router: Router,
    private overlayService: OverlayService,
    private presenceService: PresenceService,
    private auth: Auth,
    private authService: AuthService
  ) {
    this.handleVisibilityChange();
  }
  

  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) this.overlayService.closeAll();
    });

    onAuthStateChanged(this.auth, async (user) => {
      if (!user) {        
        return;
      };
      const forcedClose = await this.presenceService.checkForcedClose(user);
      if (forcedClose) {
        if(user.isAnonymous){
          await this.authService.setupGuestLogoutOnUnload();
        }
        await this.presenceService.setOffline(user);
        return;
      }
      await this.presenceService.initPresence(user);

    });
}

  private handleVisibilityChange(){
    document.addEventListener('visibilitychange', () =>{
      const user = this.auth.currentUser
      if(!user) return;

      if(document.visibilityState === 'hidden'){
        if(user.isAnonymous){
          this.visibilityTimeout = setTimeout( async ()=> {
            await this.presenceService.setOffline(user);
          },5000);
        }else{
          this.visibilityTimeout = setTimeout( async () =>{
            await this.presenceService.setOffline(user);
          }, 5000);
        }
      }else if(document.visibilityState === 'visible'){
          clearTimeout(this.visibilityTimeout);
          this.presenceService.initPresence(user);
        }
    })
  }
}
