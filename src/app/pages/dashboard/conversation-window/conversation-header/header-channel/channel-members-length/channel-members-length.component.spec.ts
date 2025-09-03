import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelMembersLengthComponent } from './channel-members-length.component';

describe('ChannelMembersLengthComponent', () => {
  let component: ChannelMembersLengthComponent;
  let fixture: ComponentFixture<ChannelMembersLengthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelMembersLengthComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChannelMembersLengthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
