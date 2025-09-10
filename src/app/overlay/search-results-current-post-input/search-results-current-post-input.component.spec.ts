import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchResultsCurrentPostInputComponent } from './search-results-current-post-input.component';

describe('SearchResultsCurrentPostInputComponent', () => {
  let component: SearchResultsCurrentPostInputComponent;
  let fixture: ComponentFixture<SearchResultsCurrentPostInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchResultsCurrentPostInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchResultsCurrentPostInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
