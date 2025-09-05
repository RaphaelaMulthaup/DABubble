import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMemberToChannelComponent } from './add-member-to-channel.component';

describe('AddMemberToChannelComponent', () => {
  let component: AddMemberToChannelComponent;
  let fixture: ComponentFixture<AddMemberToChannelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddMemberToChannelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddMemberToChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
