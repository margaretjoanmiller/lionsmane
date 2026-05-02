import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/drizzle/drizzle.module';
import { FetcherModule } from '@/fetcher/fetcher.module';
import { FolderModule } from '@/folder/folder.module';
import { OpmlModule } from '@/opml/opml.module';
import { FeedConsumer } from './feed.consumer';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { FeedDiscoverService } from './feed-discover.service';

@Module({
  imports: [
    DrizzleModule,
    BullModule.registerQueue({ name: 'feed' }, { name: 'article' }),
    FetcherModule,
    FolderModule,
    OpmlModule,
  ],
  controllers: [FeedController],
  providers: [FeedService, FeedConsumer, FeedDiscoverService],
  exports: [FeedService],
})
export class FeedModule {}
