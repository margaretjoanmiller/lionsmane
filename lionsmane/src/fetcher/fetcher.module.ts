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
    }),
  ],
  providers: [FetcherService, RedisService],
  exports: [FetcherService],
})
export class FetcherModule { }
