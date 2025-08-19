import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileViewOtherUsersComponent } from './profile-view-other-users.component';

describe('ProfileViewOtherUsersComponent', () => {
  let component: ProfileViewOtherUsersComponent;
  let fixture: ComponentFixture<ProfileViewOtherUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileViewOtherUsersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileViewOtherUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
