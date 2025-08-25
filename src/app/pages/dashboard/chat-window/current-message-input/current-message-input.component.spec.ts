import { ComponentFixture, TestBed } from '@angular/core/testing';

import { postFormComponent } from './current-message-input.component';

describe('postFormComponent', () => {
  let component: postFormComponent;
  let fixture: ComponentFixture<postFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [postFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(postFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
