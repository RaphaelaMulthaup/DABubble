import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NonAuthComponent } from './non-auth.component';

describe('NonAuthComponent', () => {
  let component: NonAuthComponent;
  let fixture: ComponentFixture<NonAuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NonAuthComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NonAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
