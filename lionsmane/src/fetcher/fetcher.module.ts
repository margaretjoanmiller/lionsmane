import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { RedisModule } from 'src/redis/redis.module';
import { RedisService } from 'src/redis/redis.service';
import { FetcherService } from './fetcher.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'article' }),
    RedisModule,
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
  providers: [FetcherService],
  exports: [FetcherService],
})
export class FetcherModule {}
