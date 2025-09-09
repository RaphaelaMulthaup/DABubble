import { AsyncPipe, CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { OverlayService } from '../../../services/overlay.service';
import { AuthService } from '../../../services/auth.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { UserInterface } from '../../../shared/models/user.interface';
import { NewAvatarSelectionComponent } from './new-avatar-selection/new-avatar-selection.component';
import { FormsModule } from '@angular/forms';
import { HeaderOverlayComponent } from '../../../shared/components/header-overlay/header-overlay.component';

@Component({
  selector: 'app-edit-profile',
  imports: [AsyncPipe, CommonModule, FormsModule, HeaderOverlayComponent],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.scss',
})
export class EditProfileComponent implements OnInit {
  @ViewChild('userNameInput') userNameInput!: ElementRef;
  user$: Observable<UserInterface | null>;
  userName: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    public overlayService: OverlayService,
    private authService: AuthService
  ) {
    this.user$= this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (user) {
        this.userName = user.name;
      }
    });
  }

  /**
   * Set autofocus in inputfield
   */
  ngAfterViewInit(): void {
    setTimeout(() => this.userNameInput.nativeElement.focus(), 0);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Shows overlay to select new avatar and close overlay
   */
  showAvatarSelection() {
    this.overlayService.openComponent(
      NewAvatarSelectionComponent,
      'cdk-overlay-dark-backdrop',
      { globalPosition: 'center' }
    );
  }

  /**
   * Saves new Username from input
   */
  saveName() {
    if (this.userName.trim()) {
      this.authService.updateUserName(this.userName.trim()).then(() => {
        this.overlayService.closeAll();
      });
    } else {
      this.overlayService.closeAll();
    }
  }
}
