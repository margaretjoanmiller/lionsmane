import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { BullModule } from '@nestjs/bullmq';
import { ArticleConsumer } from './article.consumer';
import { FetcherModule } from 'src/fetcher/fetcher.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'article' }, { name: 'filter' }),
    FetcherModule,
  ],
  providers: [ArticleService, ArticleConsumer],
  controllers: [ArticleController],
})
export class ArticleModule {}
