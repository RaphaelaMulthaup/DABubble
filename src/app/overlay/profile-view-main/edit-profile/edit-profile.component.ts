import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { OverlayService } from '../../../services/overlay.service';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { UserInterface } from '../../../shared/models/user.interface';


@Component({
  selector: 'app-edit-profile',
  imports: [
    AsyncPipe,
    CommonModule,
  ],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.scss'
})
export class EditProfileComponent implements OnInit {
  public overlayService = inject(OverlayService);
  private authService = inject(AuthService);

   user$: Observable<UserInterface | null>
  
  constructor() {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
      
  }
}
