import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { FetcherModule } from 'src/fetcher/fetcher.module';
import { ArticleConsumer } from './article.consumer';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'article' }, { name: 'filter' }),
    FetcherModule,
  ],
  providers: [ArticleService, ArticleConsumer],
  controllers: [ArticleController],
  exports: [ArticleService],
})
export class ArticleModule {}
