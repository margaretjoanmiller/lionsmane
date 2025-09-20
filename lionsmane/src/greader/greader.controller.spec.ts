import { Test, TestingModule } from '@nestjs/testing';
import { GreaderController } from './greader.controller';

describe('GreaderController', () => {
  let controller: GreaderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GreaderController],
    }).compile();

    controller = module.get<GreaderController>(GreaderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
