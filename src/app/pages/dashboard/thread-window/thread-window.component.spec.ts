import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreadWindowComponent } from './thread-window.component';

describe('ThreadWindowComponent', () => {
  let component: ThreadWindowComponent;
  let fixture: ComponentFixture<ThreadWindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreadWindowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThreadWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
