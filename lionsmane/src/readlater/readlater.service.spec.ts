import { Test, TestingModule } from '@nestjs/testing';
import { ReadlaterService } from './readlater.service';

describe('ReadlaterService', () => {
  let service: ReadlaterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReadlaterService],
    }).compile();

    service = module.get<ReadlaterService>(ReadlaterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
