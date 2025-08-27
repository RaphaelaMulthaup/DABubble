import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderChatComponent } from './header-chat.component';

describe('HeaderChatComponent', () => {
  let component: HeaderChatComponent;
  let fixture: ComponentFixture<HeaderChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderChatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
