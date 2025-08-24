import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileViewMainComponent } from './profile-view-main.component';

describe('ProfileViewMainComponent', () => {
  let component: ProfileViewMainComponent;
  let fixture: ComponentFixture<ProfileViewMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileViewMainComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileViewMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
