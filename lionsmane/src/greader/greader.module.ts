import { Module } from '@nestjs/common';
import { ArticleModule } from 'src/article/article.module';
import { FeedModule } from 'src/feed/feed.module';
import { FolderModule } from 'src/folder/folder.module';
import { GreaderController } from './greader.controller';
import { GreaderService } from './greader.service';

@Module({
  imports: [FeedModule, ArticleModule, FolderModule],
  providers: [GreaderService],
  controllers: [GreaderController],
})
export class GreaderModule {}
