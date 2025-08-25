import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationHeaderComponent } from './conversation-header.component';

describe('ConversationHeaderComponent', () => {
  let component: ConversationHeaderComponent;
  let fixture: ComponentFixture<ConversationHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConversationHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConversationHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
