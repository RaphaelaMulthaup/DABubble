import { TestBed } from '@angular/core/testing';

import { ChatActiveRouterService } from './chat-active-router.service';

describe('ChatActiveRouterService', () => {
  let service: ChatActiveRouterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatActiveRouterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
