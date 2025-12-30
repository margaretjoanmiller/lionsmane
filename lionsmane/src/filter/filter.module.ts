import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { FilterConsumer } from './filter.consumer';
import { FilterController } from './filter.controller';
import { FilterService } from './filter.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'filter' }), DrizzleModule],
  controllers: [FilterController],
  providers: [FilterService, FilterConsumer],
})
export class FilterModule {}
