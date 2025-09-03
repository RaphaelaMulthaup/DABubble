import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewAvatarSelectionComponent } from './new-avatar-selection.component';

describe('NewAvatarSelectionComponent', () => {
  let component: NewAvatarSelectionComponent;
  let fixture: ComponentFixture<NewAvatarSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewAvatarSelectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewAvatarSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
