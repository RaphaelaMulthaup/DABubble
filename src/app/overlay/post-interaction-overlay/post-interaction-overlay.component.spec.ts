import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostInteractionOverlayComponent } from './post-interaction-overlay.component';

describe('PostInteractionOverlayComponent', () => {
  let component: PostInteractionOverlayComponent;
  let fixture: ComponentFixture<PostInteractionOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostInteractionOverlayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostInteractionOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
