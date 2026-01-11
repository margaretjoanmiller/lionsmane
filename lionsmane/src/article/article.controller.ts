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
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOAuth2,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { ZodResponse } from 'nestjs-zod';
import { ArticleService } from './article.service';
import { ArticleDetailDto } from './dto/article-detail.dto';
import { ArticleListDto, HiddenArticleListDto } from './dto/article-list.dto';
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
  getPagedArticles(
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
    return await this.articleService.getArticlesForFeed(
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
    return await this.articleService.getReadArticles(
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
    return await this.articleService.getUnreadArticles(
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
    return await this.articleService.getStarredArticles(
      session.user.id,
      pageSize,
      cursor,
    );
  }

  @Get('hidden')
  @ZodResponse({ type: HiddenArticleListDto, status: 200 })
  @ApiQuery({
    name: 'ruleId',
    required: false,
    description: 'The id of the rule to filter by. Default is all.',
  })
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
  async getHiddenArticles(
    @Session() session: UserSession,
    @Query('cursor', new DefaultValuePipe(null)) cursor?: string,
    @Query('pageSize', new DefaultValuePipe(10)) pageSize?: number,
    @Query('ruleId', new DefaultValuePipe(null)) ruleId?: string,
  ) {
    return await this.articleService.getHiddenArticles(
      session.user.id,
      pageSize,
      cursor,
      ruleId,
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
    return await this.articleService.getUnreadArticlesForFeed(
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
    return await this.articleService.getStarredArticlesForFeed(
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
    return await this.articleService.getReadArticlesForFeed(
      session.user.id,
      id,
      pageSize,
      cursor,
    );
  }

  @Get('unread/folder/:id')
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
  async getUnReadArticlesForFolder(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('cursor', new DefaultValuePipe(null)) cursor?: string,
    @Query('pageSize', new DefaultValuePipe(10)) pageSize?: number,
  ) {
    return await this.articleService.getUnreadArticlesForFolder(
      session.user.id,
      id,
      pageSize,
      cursor,
    );
  }
  @Get('starred/folder/:id')
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
  async getStarredArticlesForFolder(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('cursor', new DefaultValuePipe(null)) cursor?: string,
    @Query('pageSize', new DefaultValuePipe(10)) pageSize?: number,
  ) {
    return await this.articleService.getStarredArticlesForFolder(
      session.user.id,
      id,
      pageSize,
      cursor,
    );
  }
  @Get('read/folder/:id')
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
  async getReadArticlesForFolder(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('cursor', new DefaultValuePipe(null)) cursor?: string,
    @Query('pageSize', new DefaultValuePipe(10)) pageSize?: number,
  ) {
    return await this.articleService.getReadArticlesForFolder(
      session.user.id,
      id,
      pageSize,
      cursor,
    );
  }
  @Get('folder/:id')
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
  async getAllArticlesForFolder(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('cursor', new DefaultValuePipe(null)) cursor?: string,
    @Query('pageSize', new DefaultValuePipe(10)) pageSize?: number,
  ) {
    return await this.articleService.getAllArticlesForFolder(
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
    return await this.articleService.fullArticleTextJob(id, session.user.id);
  }

  @Get(':id')
  @ZodResponse({ type: ArticleDetailDto, status: 200 })
  async getArticle(@Param('id') id: string, @Session() session: UserSession) {
    return await this.articleService.getArticle(id, session.user.id);
  }
}
