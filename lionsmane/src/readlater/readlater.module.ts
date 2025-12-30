import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { SecretsModule } from 'src/secrets/secrets.module';
import { ReadlaterController } from './readlater.controller';
import { ReadlaterService } from './readlater.service';

@Module({
  imports: [SecretsModule, HttpModule, DrizzleModule],
  providers: [ReadlaterService],
  controllers: [ReadlaterController],
  exports: [ReadlaterService],
})
export class ReadlaterModule {}
