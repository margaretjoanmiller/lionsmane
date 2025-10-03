import { Test, TestingModule } from '@nestjs/testing';
import { MinifluxController } from './miniflux.controller';

describe('MinifluxController', () => {
  let controller: MinifluxController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MinifluxController],
    }).compile();

    controller = module.get<MinifluxController>(MinifluxController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
