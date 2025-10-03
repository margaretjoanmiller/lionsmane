import { Test, TestingModule } from '@nestjs/testing';
import { MinifluxV1Controller } from './miniflux.v1.controller';

describe('MinifluxController', () => {
  let controller: MinifluxV1Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MinifluxV1Controller],
    }).compile();

    controller = module.get<MinifluxV1Controller>(MinifluxV1Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
