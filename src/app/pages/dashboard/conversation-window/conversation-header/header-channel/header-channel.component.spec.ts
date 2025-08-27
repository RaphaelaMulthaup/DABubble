import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderChannelComponent } from './header-channel.component';

describe('HeaderChannelComponent', () => {
  let component: HeaderChannelComponent;
  let fixture: ComponentFixture<HeaderChannelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderChannelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
