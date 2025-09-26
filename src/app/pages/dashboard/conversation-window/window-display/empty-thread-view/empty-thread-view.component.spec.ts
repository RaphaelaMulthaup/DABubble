import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmptyThreadViewComponent } from './empty-thread-view.component';

describe('EmptyThreadViewComponent', () => {
  let component: EmptyThreadViewComponent;
  let fixture: ComponentFixture<EmptyThreadViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyThreadViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmptyThreadViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
