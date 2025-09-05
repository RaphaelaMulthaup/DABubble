import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditDisplayedPostComponent } from './edit-displayed-post.component';

describe('EditDisplayedPostComponent', () => {
  let component: EditDisplayedPostComponent;
  let fixture: ComponentFixture<EditDisplayedPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDisplayedPostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditDisplayedPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
