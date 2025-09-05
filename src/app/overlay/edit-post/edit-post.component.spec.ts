import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPostOverlayComponent } from './edit-post.component';

describe('EditPostOverlayComponent', () => {
  let component: EditPostOverlayComponent;
  let fixture: ComponentFixture<EditPostOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPostOverlayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditPostOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
