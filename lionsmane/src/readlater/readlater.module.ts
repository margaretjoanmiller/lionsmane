import { Module } from '@nestjs/common';
import { ReadlaterController } from './readlater.controller';
import { ReadlaterService } from './readlater.service';
import { SecretsModule } from 'src/secrets/secrets.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [SecretsModule, HttpModule],
  providers: [ReadlaterService],
  controllers: [ReadlaterController],
})
export class ReadlaterModule {}
