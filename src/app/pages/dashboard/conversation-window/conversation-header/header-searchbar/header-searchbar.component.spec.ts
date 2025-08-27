import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderSearchbarComponent } from './header-searchbar.component';

describe('HeaderSearchbarComponent', () => {
  let component: HeaderSearchbarComponent;
  let fixture: ComponentFixture<HeaderSearchbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderSearchbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderSearchbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
