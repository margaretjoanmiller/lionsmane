import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { CronService } from './cron.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'feed' })],
  providers: [CronService],
})
export class CronModule {}
