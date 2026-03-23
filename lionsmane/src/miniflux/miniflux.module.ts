import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { ArticleModule } from '@/article/article.module';
import { DrizzleModule } from '@/drizzle/drizzle.module';
import { FeedModule } from '@/feed/feed.module';
import { FetcherModule } from '@/fetcher/fetcher.module';
import { FolderModule } from '@/folder/folder.module';
import { ReadlaterModule } from '@/readlater/readlater.module';
import { MinifluxService } from './miniflux.service';
import { MinifluxV1Controller } from './miniflux.v1.controller';

@Module({
  imports: [
    DrizzleModule,
    FeedModule,
    FolderModule,
    ArticleModule,
    FetcherModule,
    ReadlaterModule,
    HttpModule,
    AuthModule,
    BullModule.registerQueue({ name: 'feed' }),
  ],
  controllers: [MinifluxV1Controller],
  providers: [MinifluxService],
})
export class MinifluxModule {}
