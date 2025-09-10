import { Module } from '@nestjs/common';
import { OpmlService } from './opml.service';

@Module({
  providers: [OpmlService],
  exports: [OpmlService],
})
export class OpmlModule {}
