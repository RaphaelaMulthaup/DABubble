import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationWindowComponent } from './conversation-window.component';

describe('ConversationWindowComponent', () => {
  let component: ConversationWindowComponent;
  let fixture: ComponentFixture<ConversationWindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConversationWindowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConversationWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
