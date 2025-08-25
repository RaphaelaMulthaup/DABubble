import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationSearchbarComponent } from './conversation-searchbar.component';

describe('ConversationSearchbarComponent', () => {
  let component: ConversationSearchbarComponent;
  let fixture: ComponentFixture<ConversationSearchbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConversationSearchbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConversationSearchbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
