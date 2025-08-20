import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmPasswordAltComponent } from './confirm-password-alt.component';

describe('ConfirmPasswordAltComponent', () => {
  let component: ConfirmPasswordAltComponent;
  let fixture: ComponentFixture<ConfirmPasswordAltComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmPasswordAltComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmPasswordAltComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
