import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { RedisModule } from 'src/redis/redis.module';
import { ParserModule } from '@/parser/parser.module';
import { FetcherService } from './fetcher.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'article' }),
    DrizzleModule,
    RedisModule,
    ParserModule,
  ],
  providers: [FetcherService],
  exports: [FetcherService],
})
export class FetcherModule {}
