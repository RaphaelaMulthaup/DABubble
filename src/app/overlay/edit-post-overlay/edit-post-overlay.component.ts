import { Component } from '@angular/core';
import { PostInterface } from '../../shared/models/post.interface';

@Component({
  selector: 'app-edit-post-overlay',
  imports: [],
  templateUrl: './edit-post-overlay.component.html',
  styleUrl: './edit-post-overlay.component.scss'
})
export class EditPostOverlayComponent {
  post!: PostInterface;
}
