import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ArticleDetailDto } from './dto/article-detail.dto';
import { ArticleService } from './article.service';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { ArticleListDto } from './dto/article-list.dto';
import { ArticleSearchDto } from './dto/article-search.dto';

@ApiTags('articles')
@Controller('article')
export class ArticleController {
  constructor(private articleService: ArticleService) {}

  @Get()
  @ZodResponse({ type: ArticleListDto })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description:
      'The cursor for pagination. If not provided, starts from the beginning.',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'The number of articles to return. Default is 10.',
  })
  async getPagedArticles(
    @Session() session: UserSession,
    @Query('cursor', new DefaultValuePipe(null)) cursor?: string,
    @Query('pageSize', new DefaultValuePipe(10)) pageSize?: number,
  ) {
    return this.articleService.getArticles(session.user.id, cursor, pageSize);
  }

  //TODO: mark read or starred

  @Get('search')
  @ZodResponse({ type: ArticleSearchDto })
  @ApiQuery({
    name: 'query',
    required: true,
    description: 'The search query string.',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'The number of articles to return. Default is 10.',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'The page offset. Default is 0.',
  })
  async searchArticles(
    @Session() session: UserSession,
    @Query('query') query: string,
    @Query('offset', new DefaultValuePipe(0)) offset: number,
    @Query('pageSize', new DefaultValuePipe(10)) pageSize: number,
  ) {
    return await this.articleService.articleSearch(
      session.user.id,
      query,
      offset,
      pageSize,
    );
  }

  @Get(':id')
  @ZodResponse({ type: ArticleDetailDto })
  async getArticle(@Param('id') id: string, @Session() session: UserSession) {
    return this.articleService.getArticle(id, session.user.id);
  }
}
