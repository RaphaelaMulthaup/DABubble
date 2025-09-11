import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchResultsNewMessageComponent } from './search-results-new-message.component';

describe('SearchResultsNewMessageComponent', () => {
  let component: SearchResultsNewMessageComponent;
  let fixture: ComponentFixture<SearchResultsNewMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchResultsNewMessageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchResultsNewMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
