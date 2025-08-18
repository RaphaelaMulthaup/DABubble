import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateThreadFormComponent } from './current-message-input.component';

describe('CreateThreadFormComponent', () => {
  let component: CreateThreadFormComponent;
  let fixture: ComponentFixture<CreateThreadFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateThreadFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateThreadFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
