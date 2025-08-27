import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAccountBtnComponent } from './create-account-btn.component';

describe('CreateAccountBtnComponent', () => {
  let component: CreateAccountBtnComponent;
  let fixture: ComponentFixture<CreateAccountBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAccountBtnComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateAccountBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
