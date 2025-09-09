import {
  Component,
  EventEmitter,
  inject,
  Output,
  WritableSignal,
} from '@angular/core';
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
  // @Output() editingCurrentPost = new EventEmitter<boolean>;
  // editPostActive!: WritableSignal<boolean>;

  constructor(private overlayService: OverlayService) {}

  confirmEdit() {
    // this.editingCurrentPost.emit(true);
    // this.overlayService.editPostActive = true;
    this.overlayService.editingPostId.set(this.post.id!);
    this.overlayService.closeAll();
  }
}
