import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { FeedService } from './feed.service';

describe('FeedService', () => {
  let service: FeedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: 'BullQueue_feed',
          useValue: {
            registerQueue: vi.fn().mockReturnValue({ name: 'article' }),
          },
        },
        {
          provide: 'DB',
          useValue: {
            db: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
