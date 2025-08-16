import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateChannelFormComponent } from './create-channel-form.component';

describe('CreateChannelFormComponent', () => {
  let component: CreateChannelFormComponent;
  let fixture: ComponentFixture<CreateChannelFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateChannelFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateChannelFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
