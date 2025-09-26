import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'email' })],
  providers: [EmailService],
})
export class EmailModule {}
