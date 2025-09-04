import { Module } from '@nestjs/common';
import { FetcherService } from './fetcher.service';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from 'src/redis/redis.module';
import { RedisService } from 'src/redis/redis.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'article' }), RedisModule],
  providers: [FetcherService, RedisService],
  exports: [FetcherService],
})
export class FetcherModule {}
