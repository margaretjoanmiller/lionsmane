import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/drizzle/drizzle.module';
import { CronService } from './cron.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'feed' }), DrizzleModule],
  providers: [CronService],
})
export class CronModule {}
