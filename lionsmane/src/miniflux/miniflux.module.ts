import { Module } from '@nestjs/common';
import { MinifluxController } from './miniflux.controller';
import { MinifluxService } from './miniflux.service';

@Module({
  controllers: [MinifluxController],
  providers: [MinifluxService]
})
export class MinifluxModule {}
