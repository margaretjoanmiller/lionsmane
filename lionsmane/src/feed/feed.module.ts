import { HttpModule } from '@nestjs/axios';
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
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; LionsMane/0.1; +https://codeberg.org/0x4d6165/lionsmane)',
        Accept: '*/*',
      },
    }),
  ],
  controllers: [FeedController],
  providers: [FeedService, FeedConsumer],
  exports: [FeedService],
})
export class FeedModule {}
