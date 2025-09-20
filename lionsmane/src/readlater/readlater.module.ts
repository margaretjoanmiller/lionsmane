import { Module } from '@nestjs/common';
import { SecretsService } from 'src/secrets/secrets.service';
import { ReadlaterController } from './readlater.controller';
import { ReadlaterService } from './readlater.service';

@Module({
  imports: [SecretsService],
  providers: [ReadlaterService],
  controllers: [ReadlaterController],
})
export class ReadlaterModule {}
