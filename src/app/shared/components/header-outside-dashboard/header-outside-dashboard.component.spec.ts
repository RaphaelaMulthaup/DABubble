import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderOutsideDashboardComponent } from './header-outside-dashboard.component';

describe('HeaderOutsideDashboardComponent', () => {
  let component: HeaderOutsideDashboardComponent;
  let fixture: ComponentFixture<HeaderOutsideDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderOutsideDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderOutsideDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
