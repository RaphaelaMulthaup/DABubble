import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WindowDisplayComponent } from './window-display.component';

describe('WindowDisplayComponent', () => {
  let component: WindowDisplayComponent;
  let fixture: ComponentFixture<WindowDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WindowDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WindowDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
