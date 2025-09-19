import { Module } from '@nestjs/common';
import { ReadlaterService } from './readlater.service';
import { ReadlaterController } from './readlater.controller';

@Module({
  providers: [ReadlaterService],
  controllers: [ReadlaterController]
})
export class ReadlaterModule {}
