import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeChannelNameComponent } from './change-channel-name.component';

describe('ChangeChannelNameComponent', () => {
  let component: ChangeChannelNameComponent;
  let fixture: ComponentFixture<ChangeChannelNameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeChannelNameComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangeChannelNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
