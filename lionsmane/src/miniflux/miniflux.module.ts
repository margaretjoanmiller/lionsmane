import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { ArticleModule } from 'src/article/article.module';
import { FeedModule } from 'src/feed/feed.module';
import { FolderModule } from 'src/folder/folder.module';
import { ReadlaterModule } from 'src/readlater/readlater.module';
import { MinifluxService } from './miniflux.service';
import { MinifluxV1Controller } from './miniflux.v1.controller';

@Module({
  imports: [
    FeedModule,
    FolderModule,
    ArticleModule,
    ReadlaterModule,
    HttpModule,
    AuthModule,
    BullModule.registerQueue({ name: 'feed' }),
  ],
  controllers: [MinifluxV1Controller],
  providers: [MinifluxService],
})
export class MinifluxModule {}
