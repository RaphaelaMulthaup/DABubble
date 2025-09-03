import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { OverlayService } from '../../../services/overlay.service';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { UserInterface } from '../../../shared/models/user.interface';
import { NewAvatarSelectionComponent } from './new-avatar-selection/new-avatar-selection.component';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-edit-profile',
  imports: [
    AsyncPipe,
    CommonModule,
    FormsModule
  ],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.scss'
})
export class EditProfileComponent implements OnInit {
  public overlayService = inject(OverlayService);
  private authService = inject(AuthService);

  user$: Observable<UserInterface | null>
  userName: string = '';
  
  constructor() {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
      
  }

  showAvatarSelection() {
    this.overlayService.displayOverlay(NewAvatarSelectionComponent, 'Neuen Avatar wählen')
  }

  saveName() {
   if (this.userName.trim()) {
    this.authService.updateUserName(this.userName.trim()).then(() => {
      this.overlayService.hideOverlay();
    })
   } else {
    this.overlayService.hideOverlay();
   }
  }
}
