import { Test, TestingModule } from '@nestjs/testing';
import { MinifluxService } from './miniflux.service';

describe('MinifluxService', () => {
  let service: MinifluxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MinifluxService],
    }).compile();

    service = module.get<MinifluxService>(MinifluxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
