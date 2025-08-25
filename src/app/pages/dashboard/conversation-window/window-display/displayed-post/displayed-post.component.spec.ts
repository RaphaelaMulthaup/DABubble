import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayedPostComponent } from './displayed-post.component';

describe('DisplayedPostComponent', () => {
  let component: DisplayedPostComponent;
  let fixture: ComponentFixture<DisplayedPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayedPostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayedPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
