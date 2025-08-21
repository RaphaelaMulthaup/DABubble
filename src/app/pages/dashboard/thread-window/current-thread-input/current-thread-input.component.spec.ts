import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentThreadInputComponent } from './current-thread-input.component';

describe('CurrentThreadInputComponent', () => {
  let component: CurrentThreadInputComponent;
  let fixture: ComponentFixture<CurrentThreadInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrentThreadInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrentThreadInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
