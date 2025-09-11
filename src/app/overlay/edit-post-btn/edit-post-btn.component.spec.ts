import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPostBtnComponent } from './edit-post-btn.component';

describe('EditPostOverlayComponent', () => {
  let component: EditPostBtnComponent;
  let fixture: ComponentFixture<EditPostBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPostBtnComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditPostBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
