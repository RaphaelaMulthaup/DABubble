import { AsyncPipe, CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { OverlayService } from '../../../services/overlay.service';
import { AuthService } from '../../../services/auth.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { UserInterface } from '../../../shared/models/user.interface';
import { NewAvatarSelectionComponent } from './new-avatar-selection/new-avatar-selection.component';
import { FormsModule } from '@angular/forms';
import { HeaderOverlayComponent } from '../../../shared/components/header-overlay/header-overlay.component';
import { OverlayRef } from '@angular/cdk/overlay';

@Component({
  selector: 'app-edit-profile',
  imports: [AsyncPipe, CommonModule, FormsModule, HeaderOverlayComponent],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.scss',
})
export class EditProfileComponent implements OnInit {
  @Output() overlayRef!: OverlayRef;
  @ViewChild('userNameInput') userNameInput!: ElementRef;
  user$: Observable<UserInterface | null>;
  private destroy$ = new Subject<void>();
  userName: string = '';

  constructor(
    private authService: AuthService,
    public overlayService: OverlayService
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

  ngAfterViewInit(): void {
    setTimeout(() => this.userNameInput.nativeElement.focus(), 0);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * This function opens the NewAvatarSelection-Overlay.
   */
  openNewAvatarSelectionOverlay() {
    const overlay = this.overlayService.openComponent(
      NewAvatarSelectionComponent,
      'cdk-overlay-dark-backdrop',
      { globalPosition: 'center' }
    );
    overlay!.ref.instance.overlayRef = overlay?.overlayRef as OverlayRef;
  }

  /**
   * Updates the users name.
   */
  changeUserName() {
    if (this.userName.trim()) {
      this.authService.updateUserName(this.userName.trim()).then(() => {
        this.overlayService.closeOne(this.overlayRef);
      });
    } else { this.overlayService.closeOne(this.overlayRef); }
  }
}
