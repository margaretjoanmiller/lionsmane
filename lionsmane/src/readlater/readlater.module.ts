import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { SecretsModule } from 'src/secrets/secrets.module';
import { ReadlaterController } from './readlater.controller';
import { ReadlaterService } from './readlater.service';

@Module({
  imports: [SecretsModule, HttpModule],
  providers: [ReadlaterService],
  controllers: [ReadlaterController],
})
export class ReadlaterModule {}
