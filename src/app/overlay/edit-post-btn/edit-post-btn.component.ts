import { Component } from '@angular/core';
import { PostInterface } from '../../shared/models/post.interface';
import { OverlayService } from '../../services/overlay.service';

@Component({
  selector: 'app-edit-post-overlay',
  imports: [],
  templateUrl: './edit-post-btn.component.html',
  styleUrl: './edit-post-btn.component.scss',
})
export class EditPostBtnComponent {
  post!: PostInterface;

  constructor(private overlayService: OverlayService) {}

  /**
   * Sets the editingPostId to the current post id.
   * After that, all overlays are closed.
   */
  confirmEdit() {
    this.overlayService.editingPostId.set(this.post.id!);
    this.overlayService.closeAll();
  }
}
