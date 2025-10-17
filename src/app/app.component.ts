import { Component, HostListener } from '@angular/core';
import { RouterOutlet, Router, NavigationStart } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OverlayService } from './services/overlay.service';
import { AuthService } from './services/auth.service';
import { Auth, signOut } from '@angular/fire/auth';
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'DABubble';

  constructor(
    private auth:Auth,
    private authService: AuthService,
    private router: Router,
    private overlayService: OverlayService,
    private firestore: Firestore
  ) {}

  ngOnInit() {
     let isRefresh = false;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.overlayService.closeAll();
      }
    });
    window.addEventListener("beforeunload", ()=>{
      const user = this.authService.currentUser;
          const userRef = doc(this.firestore, `users/${user!.uid}`);
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceEntry;

      if(navigation?.entryType === 'reload'){
        isRefresh = true;
      }

      if(user && !isRefresh){
        try{
          updateDoc(userRef, { active: false });
        }catch(err){
          console.warn('Sing-out failed:',err);
        }
      }
    })
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: Event) {
    this.authService.logout();
  }
}
