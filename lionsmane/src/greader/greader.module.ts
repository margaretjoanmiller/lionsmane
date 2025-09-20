import { Module } from '@nestjs/common';
import { GreaderService } from './greader.service';
import { GreaderController } from './greader.controller';

@Module({
  providers: [GreaderService],
  controllers: [GreaderController]
})
export class GreaderModule {}
