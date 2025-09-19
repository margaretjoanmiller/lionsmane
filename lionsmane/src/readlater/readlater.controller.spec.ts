import { Test, TestingModule } from '@nestjs/testing';
import { ReadlaterController } from './readlater.controller';

describe('ReadlaterController', () => {
  let controller: ReadlaterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReadlaterController],
    }).compile();

    controller = module.get<ReadlaterController>(ReadlaterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
