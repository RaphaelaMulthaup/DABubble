import { TestBed } from '@angular/core/testing';

import { ChannelSelectionService } from './channel-selection.service';

describe('ChannelSelectionService', () => {
  let service: ChannelSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChannelSelectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
