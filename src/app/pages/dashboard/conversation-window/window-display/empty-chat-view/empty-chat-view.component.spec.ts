import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmptyChatViewComponent } from './empty-chat-view.component';

describe('EmptyChatViewComponent', () => {
  let component: EmptyChatViewComponent;
  let fixture: ComponentFixture<EmptyChatViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyChatViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmptyChatViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
