import { Module } from '@nestjs/common';
import { RobotsService } from './robots.service';

@Module({
  providers: [RobotsService],
})
export class RobotsModule {}
