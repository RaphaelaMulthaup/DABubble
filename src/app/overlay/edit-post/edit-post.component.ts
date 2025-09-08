import { Component, EventEmitter, inject, Output } from '@angular/core';
import { PostInterface } from '../../shared/models/post.interface';
import { OverlayService } from '../../services/overlay.service';

@Component({
  selector: 'app-edit-post-overlay',
  imports: [],
  templateUrl: './edit-post.component.html',
  styleUrl: './edit-post.component.scss',
})
export class EditPostOverlayComponent {
  overlayService = inject(OverlayService);
  post!: PostInterface;
  @Output() editPostActive = new EventEmitter<boolean>;

  confirmEdit() {
    this.editPostActive.emit(true)
    this.overlayService.editPostActive = true;
    this.overlayService.close();
  }
}
