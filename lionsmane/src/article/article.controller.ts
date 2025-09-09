import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiBearerAuth,
  ApiOAuth2,
  ApiQuery,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ArticleDetailDto } from './dto/article-detail.dto';
import { ArticleService } from './article.service';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { ArticleListDto } from './dto/article-list.dto';
import { ArticleSearchDto } from './dto/article-search.dto';
import { ArticleStatusDto } from './dto/article-status.dto';

@ApiTags('articles')
@ApiCookieAuth()
@ApiBearerAuth()
@ApiOAuth2(['openid', 'profile', 'email'])
@Controller('article')
export class ArticleController {
  constructor(private articleService: ArticleService) {}

  @Get()
  @ZodResponse({ type: ArticleListDto, status: 200 })
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

  @Patch('status/:id')
  @ApiQuery({
    name: 'status',
    required: true,
    description:
      "The status to update. Must be one of 'read', 'unread', 'starred', or 'unstarred'.",
  })
  @ZodResponse({ type: ArticleStatusDto, status: 200 })
  async updateArticleStatus(
    @Param('id') id: string,
    @Query('status') status: 'read' | 'unread' | 'starred' | 'unstarred',
    @Session() session: UserSession,
  ) {
    return await this.articleService.updateArticleStatus(
      id,
      status,
      session.user.id,
    );
  }

  @Get('search')
  @ZodResponse({ type: ArticleSearchDto, status: 200 })
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

  @Get('feed/:id')
  @ZodResponse({ type: ArticleListDto, status: 200 })
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
  async getPagedArticlesForFeed(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('cursor', new DefaultValuePipe(null)) cursor?: string,
    @Query('pageSize', new DefaultValuePipe(10)) pageSize?: number,
  ) {
    return this.articleService.getArticlesForFeed(
      session.user.id,
      id,
      cursor,
      pageSize,
    );
  }

  @Get('read')
  @ZodResponse({ type: ArticleListDto, status: 200 })
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
  async getReadArticles(
    @Session() session: UserSession,
    @Query('cursor', new DefaultValuePipe(null)) cursor?: string,
    @Query('pageSize', new DefaultValuePipe(10)) pageSize?: number,
  ) {
    return this.articleService.getReadArticles(
      session.user.id,
      pageSize,
      cursor,
    );
  }

  @Get('unread')
  @ZodResponse({ type: ArticleListDto, status: 200 })
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
  async getUnReadArticles(
    @Session() session: UserSession,
    @Query('cursor', new DefaultValuePipe(null)) cursor?: string,
    @Query('pageSize', new DefaultValuePipe(10)) pageSize?: number,
  ) {
    return this.articleService.getUnreadArticles(
      session.user.id,
      pageSize,
      cursor,
    );
  }
  @Get('starred')
  @ZodResponse({ type: ArticleListDto, status: 200 })
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
  async getStarredArticles(
    @Session() session: UserSession,
    @Query('cursor', new DefaultValuePipe(null)) cursor?: string,
    @Query('pageSize', new DefaultValuePipe(10)) pageSize?: number,
  ) {
    return this.articleService.getStarredArticles(
      session.user.id,
      pageSize,
      cursor,
    );
  }
  @Get('unread/feed/:id')
  @ZodResponse({ type: ArticleListDto, status: 200 })
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
  async getUnReadArticlesForFeed(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('cursor', new DefaultValuePipe(null)) cursor?: string,
    @Query('pageSize', new DefaultValuePipe(10)) pageSize?: number,
  ) {
    return this.articleService.getUnreadArticlesForFeed(
      session.user.id,
      id,
      pageSize,
      cursor,
    );
  }
  @Get('starred/feed/:id')
  @ZodResponse({ type: ArticleListDto, status: 200 })
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
  async getStarredArticlesForFeed(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('cursor', new DefaultValuePipe(null)) cursor?: string,
    @Query('pageSize', new DefaultValuePipe(10)) pageSize?: number,
  ) {
    return this.articleService.getStarredArticlesForFeed(
      session.user.id,
      id,
      pageSize,
      cursor,
    );
  }
  @Get('read/feed/:id')
  @ZodResponse({ type: ArticleListDto, status: 200 })
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
  async getReadArticlesForFeed(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('cursor', new DefaultValuePipe(null)) cursor?: string,
    @Query('pageSize', new DefaultValuePipe(10)) pageSize?: number,
  ) {
    return this.articleService.getReadArticlesForFeed(
      session.user.id,
      id,
      pageSize,
      cursor,
    );
  }

  @Post('readable/:id')
  @ApiResponse({ status: 202, description: 'Request accepted' })
  async requestFullArticleText(
    @Param('id') id: string,
    @Session() session: UserSession,
  ) {
    return this.articleService.fullArticleTextJob(id, session.user.id);
  }

  @Get(':id')
  @ZodResponse({ type: ArticleDetailDto, status: 200 })
  async getArticle(@Param('id') id: string, @Session() session: UserSession) {
    return this.articleService.getArticle(id, session.user.id);
  }
}
