import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateThreadFormComponent } from './create-thread-form.component';

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
