import { Test, TestingModule } from '@nestjs/testing';
import { FetcherService } from './fetcher.service';
import { BullModule } from '@nestjs/bullmq';

describe('FetcherService', () => {
  let service: FetcherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FetcherService,
        {
          provide: BullModule,
          useValue: {
            registerQueue: jest.fn().mockReturnValue({ name: 'article' }),
          },
        },
      ],
    }).compile();

    service = module.get<FetcherService>(FetcherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
