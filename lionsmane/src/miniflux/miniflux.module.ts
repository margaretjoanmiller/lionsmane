import { Module } from '@nestjs/common';
import { FeedModule } from 'src/feed/feed.module';
import { MinifluxService } from './miniflux.service';
import { MinifluxV1Controller } from './miniflux.v1.controller';

@Module({
  imports: [FeedModule],
  controllers: [MinifluxV1Controller],
  providers: [MinifluxService],
})
export class MinifluxModule {}
