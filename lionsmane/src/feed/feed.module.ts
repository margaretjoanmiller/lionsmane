import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { BullModule } from '@nestjs/bullmq';
import { FeedConsumer } from './feed.consumer';
import { FetcherModule } from 'src/fetcher/fetcher.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'feed' }, { name: 'article' }),
    FetcherModule,
  ],
  controllers: [FeedController],
  providers: [FeedService, FeedConsumer],
})
export class FeedModule {}
