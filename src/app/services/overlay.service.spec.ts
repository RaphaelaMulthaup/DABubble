import { TestBed } from '@angular/core/testing';

import { OverlayService } from './services/overlay.service';

describe('OverlayService', () => {
  let service: OverlayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OverlayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
