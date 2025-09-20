import { Test, TestingModule } from '@nestjs/testing';
import { GreaderService } from './greader.service';

describe('GreaderService', () => {
  let service: GreaderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GreaderService],
    }).compile();

    service = module.get<GreaderService>(GreaderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
