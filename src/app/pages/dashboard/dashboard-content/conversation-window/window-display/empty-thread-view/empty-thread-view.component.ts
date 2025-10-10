import { Component, Input } from '@angular/core';
import { PostInterface } from '../../../../../../shared/models/post.interface';
import { PostService } from '../../../../../../services/post.service';
import { DisplayedPostComponent } from '../displayed-post/displayed-post.component';
import { DAYS } from '../../../../../../shared/constants/days';

@Component({
  selector: 'app-empty-thread-view',
  imports: [DisplayedPostComponent],
  templateUrl: './empty-thread-view.component.html',
  styleUrl: './empty-thread-view.component.scss'
})
export class EmptyThreadViewComponent {
  @Input() post!: PostInterface;
  days = DAYS;

  constructor(public postService: PostService){}
}
