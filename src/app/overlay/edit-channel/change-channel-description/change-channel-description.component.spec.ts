import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeChannelDescriptionComponent } from './change-channel-description.component';

describe('ChangeChannelDescriptionComponent', () => {
  let component: ChangeChannelDescriptionComponent;
  let fixture: ComponentFixture<ChangeChannelDescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeChannelDescriptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangeChannelDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
