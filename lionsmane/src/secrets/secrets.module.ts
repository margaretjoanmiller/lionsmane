import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/drizzle/drizzle.module';
import { SecretsService } from './secrets.service';

@Module({
  imports: [DrizzleModule],
  providers: [SecretsService],
  exports: [SecretsService],
})
export class SecretsModule {}
