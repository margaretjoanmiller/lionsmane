import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { ArticleDetailDto } from './dto/article-detail.dto';
import { ArticleService } from './article.service';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { ArticleListDto } from './dto/article-list.dto';

@ApiTags('articles')
@Controller('article')
export class ArticleController {
  constructor(private articleService: ArticleService) {}

  @Get(':id')
  @ZodSerializerDto(ArticleDetailDto)
  @ApiResponse({ status: 200, type: ArticleDetailDto })
  async getArticle(@Param('id') id: string, @Session() session: UserSession) {
    return this.articleService.getArticle(id, session.user.id);
  }

  @Get()
  @ZodSerializerDto(ArticleListDto)
  @ApiResponse({ status: 200, type: ArticleListDto })
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
}
