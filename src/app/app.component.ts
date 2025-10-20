import { Component} from '@angular/core';
import { RouterOutlet, Router, NavigationStart } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OverlayService } from './services/overlay.service';

import { PresenceService } from './services/presence.service';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { signOut } from '@angular/fire/auth';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'DABubble';
  private visibilityTimeout: any;
    checkingPresence = true; // 🔹 flag pentru a bloca UI

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
      if (event instanceof NavigationStart) {
        this.overlayService.closeAll();
      }
    });

    onAuthStateChanged(this.auth, async (user) => {
      if (!user) {        
        this.checkingPresence = false;
        return 
      };

      // 1️⃣ Verifică dacă user a fost forțat să se deconecteze
      const forcedClose = await this.presenceService.checkForcedClose(user);
      if (forcedClose) {
        await this.presenceService.setOfflineSync(user); // resetează flag-ul
        await this.authService.logout();
        return;
      }

      // 2️⃣ Inițializează prezența normală
          this.checkingPresence = false; // acum putem arăta aplicația

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
            // await signOut(this.auth);
          },5000);
        }else{
          this.visibilityTimeout = setTimeout( async () =>{
            await this.presenceService.setOffline(user);
            // await signOut(this.auth);
          }, 5000);
        }
      }else if(document.visibilityState === 'visible'){
          clearTimeout(this.visibilityTimeout);
          this.presenceService.initPresence(user);
        }
    })
  }
}
