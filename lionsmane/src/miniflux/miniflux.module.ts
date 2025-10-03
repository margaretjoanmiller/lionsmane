import { Module } from '@nestjs/common';
import { FeedModule } from 'src/feed/feed.module';
import { MinifluxController } from './miniflux.controller';
import { MinifluxService } from './miniflux.service';

@Module({
  imports: [FeedModule],
  controllers: [MinifluxController],
  providers: [MinifluxService],
})
export class MinifluxModule {}
