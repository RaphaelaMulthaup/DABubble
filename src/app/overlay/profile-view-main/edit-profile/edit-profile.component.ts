import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { OverlayService } from '../../../services/overlay.service';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { UserInterface } from '../../../shared/models/user.interface';
import { NewAvatarSelectionComponent } from './new-avatar-selection/new-avatar-selection.component';
import { FormsModule } from '@angular/forms';
import { HeaderOverlayComponent } from "../../../shared/components/header-overlay/header-overlay.component";


@Component({
  selector: 'app-edit-profile',
  imports: [
    AsyncPipe,
    CommonModule,
    FormsModule,
    HeaderOverlayComponent
],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.scss'
})
export class EditProfileComponent implements OnInit {
  @ViewChild('userNameInput') userNameInput!: ElementRef;
  public overlayService = inject(OverlayService);
  private authService = inject(AuthService);

  user$: Observable<UserInterface | null>
  userName: string = '';
  
  constructor() {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.user$.subscribe(user => {
      if (user) {
        this.userName = user.name;
      }
    })
  }

  /**
   * Set autofocus in inputfield
   */
  ngAfterViewInit(): void {
    setTimeout(() => this.userNameInput.nativeElement.focus(), 0);
  }

  /**
   * Shows overlay to select new avatar and close overlay
   */
  showAvatarSelection() {
    this.overlayService.openComponent(
      NewAvatarSelectionComponent,
      'cdk-overlay-dark-backdrop',
      { globalPosition: 'center' }
    )
  }


  /**
   * Saves new Username from input
   */
  saveName() {
   if (this.userName.trim()) {
    this.authService.updateUserName(this.userName.trim()).then(() => {
      this.overlayService.close();
    })
   } else {
    this.overlayService.close();
   }
  }
}
