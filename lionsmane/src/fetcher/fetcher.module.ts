import { Module } from '@nestjs/common';
import { FetcherService } from './fetcher.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [BullModule.registerQueue({ name: 'article' })],
  providers: [FetcherService],
})
export class FetcherModule {}
