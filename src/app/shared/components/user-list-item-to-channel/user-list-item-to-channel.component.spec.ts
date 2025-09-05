import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserListItemToChannelComponent } from './user-list-item-to-channel.component';

describe('UserListItemToChannelComponent', () => {
  let component: UserListItemToChannelComponent;
  let fixture: ComponentFixture<UserListItemToChannelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListItemToChannelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserListItemToChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
