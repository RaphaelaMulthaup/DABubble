import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayedMessageComponent } from './displayed-message.component';

describe('DisplayedMessageComponent', () => {
  let component: DisplayedMessageComponent;
  let fixture: ComponentFixture<DisplayedMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayedMessageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayedMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
