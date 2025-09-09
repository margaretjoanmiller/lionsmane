import { Module } from '@nestjs/common';
import { FilterService } from './filter.service';
import { FilterController } from './filter.controller';
import { BullModule } from '@nestjs/bullmq';
import { FilterConsumer } from './filter.consumer';

@Module({
  imports: [BullModule.registerQueue({ name: 'filter' })],
  controllers: [FilterController],
  providers: [FilterService, FilterConsumer],
})
export class FilterModule {}
