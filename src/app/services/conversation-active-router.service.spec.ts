import { TestBed } from '@angular/core/testing';

import { ConversationActiveRouterService } from './conversation-active-router.service';

describe('ConversationActiveRouterService', () => {
  let service: ConversationActiveRouterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConversationActiveRouterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
