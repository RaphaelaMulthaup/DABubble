import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReactedUsersComponent } from './reacted-users.component';

describe('ReactedUsersComponent', () => {
  let component: ReactedUsersComponent;
  let fixture: ComponentFixture<ReactedUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactedUsersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReactedUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
