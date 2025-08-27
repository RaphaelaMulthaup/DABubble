import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderThreadComponent } from './header-thread.component';

describe('HeaderThreadComponent', () => {
  let component: HeaderThreadComponent;
  let fixture: ComponentFixture<HeaderThreadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderThreadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderThreadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
