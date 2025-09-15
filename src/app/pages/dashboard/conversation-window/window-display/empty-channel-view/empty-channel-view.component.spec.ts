import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmptyChannelViewComponent } from './empty-channel-view.component';

describe('EmptyChannelViewComponent', () => {
  let component: EmptyChannelViewComponent;
  let fixture: ComponentFixture<EmptyChannelViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyChannelViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmptyChannelViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
