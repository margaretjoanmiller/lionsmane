import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { FetcherModule } from 'src/fetcher/fetcher.module';
import { OpmlModule } from 'src/opml/opml.module';
import { FeedConsumer } from './feed.consumer';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'feed' }, { name: 'article' }),
    FetcherModule,
    OpmlModule,
  ],
  controllers: [FeedController],
  providers: [FeedService, FeedConsumer],
  exports: [FeedService],
})
export class FeedModule {}
