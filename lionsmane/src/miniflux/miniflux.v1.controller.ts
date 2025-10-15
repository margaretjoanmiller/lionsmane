import { CacheInterceptor } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Param,
  ParseFilePipeBuilder,
  Post,
  Put,
  Query,
  Req,
  StreamableFile,
  UnauthorizedException,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBasicAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthService,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request as ExpressRequest } from 'express';
import { ZodResponse } from 'nestjs-zod';
import { auth } from 'src/auth';
import { FileDto } from 'src/feed/dto/file.dto';
import { FeedService } from 'src/feed/feed.service';
import { DiscoverDto } from 'src/zod/discover.dto';
import { DiscoverOutDto } from '../zod/discover.dto';
import { CategoryOutDto, CreateCategoryDto } from './dto/category.dto';
import { CountersDto, EntriesListDto, UpdateEntriesDto } from './dto/entry.dto';
import { CreateFeedDto, FeedMini, UpdateFeedMiniDto } from './dto/feed.dto';
import { UserSchemaDto } from './dto/user.dto';
import { MiniHttpExceptionFilter } from './exception.filter';
import { MinifluxService } from './miniflux.service';

@ApiTags('miniflux')
@ApiBasicAuth()
@UseInterceptors(CacheInterceptor)
@UseFilters(MiniHttpExceptionFilter)
@Controller('miniflux/v1')
export class MinifluxV1Controller {
  constructor(
    private readonly minifluxService: MinifluxService,
    private readonly feedService: FeedService,
    private authService: AuthService<typeof auth>,
  ) {}

  private readonly logger = new Logger(MinifluxV1Controller.name);

  @Post('discover')
  @ZodResponse({ type: [DiscoverOutDto], status: 200 })
  discoverSubscriptions(@Body() discoverDto: DiscoverDto) {
    return this.minifluxService.discoverFeeds(discoverDto);
  }

  @Get('export')
  @ApiResponse({ status: 200, description: 'OPML file exported' })
  async export(@Session() session: UserSession): Promise<StreamableFile> {
    try {
      const buffer = await this.feedService.buildOpml(session.user.id);
      return new StreamableFile(buffer);
    } catch (error) {
      this.logger.error('Error exporting OPML', error);
      throw new InternalServerErrorException('Error exporting OPML', {
        cause: error,
      });
    }
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'OPML file to import',
    required: true,
    type: FileDto,
  })
  @ApiResponse({ status: 201, description: 'Feed imported' })
  @ApiResponse({ status: 400, description: 'Invalid OPML file' })
  async import(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 5120 }) // 5KB
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
    @Session() session: UserSession,
  ) {
    try {
      return await this.feedService.importOpml(
        session.user.id,
        file.buffer.toString(),
      );
    } catch (error) {
      this.logger.error('Error importing OPML', error);
      throw new BadRequestException('Error importing OPML', { cause: error });
    }
  }

  @Get('version')
  getVersion() {
    return {
      version: '2.0.49',
      commit: '69779e795',
      build_date: '2023-10-14T20:12:04-0700',
      go_version: 'go1.21.1',
      compiler: 'gc',
      arch: 'amd64',
      os: 'linux',
    };
  }

  @Get('feeds')
  @ZodResponse({ type: [FeedMini], status: HttpStatus.OK })
  getFeeds(@Session() session: typeof auth.$Infer.Session) {
    return this.minifluxService.getFeeds(session.user.id);
  }

  @Get('feeds/counters')
  @ZodResponse({ type: CountersDto, status: HttpStatus.OK })
  getFeedCounters(@Session() session: typeof auth.$Infer.Session) {
    return this.minifluxService.getCounters(session.user.id);
  }

  @Get('feeds/:feedId')
  @ZodResponse({ type: FeedMini, status: HttpStatus.OK })
  getFeed(
    @Param('feedId') feedId: number,
    @Session() session: typeof auth.$Infer.Session,
  ) {
    return this.minifluxService.getFeed(session.user.id, feedId);
  }

  @Post('feeds')
  @HttpCode(HttpStatus.CREATED)
  createFeed(
    @Body() createFeedDto: CreateFeedDto,
    @Session() session: typeof auth.$Infer.Session,
  ) {
    return this.minifluxService.createFeed(session.user.id, createFeedDto);
  }

  @Put('feeds/:feedId')
  updateFeed(
    @Param('feedId') feedId: number,
    @Body() updateFeedDto: UpdateFeedMiniDto,
    @Session() session: typeof auth.$Infer.Session,
  ) {
    return this.minifluxService.updateFeed(
      session.user.id,
      feedId,
      updateFeedDto,
    );
  }

  @Put('feeds/:feedId/refresh')
  @HttpCode(HttpStatus.NO_CONTENT)
  refreshFeed(@Param('feedId') feedId: number) {
    // this.minifluxService.refreshFeed(feedId);
    return;
  }

  @Put('feeds/refresh')
  @HttpCode(HttpStatus.NO_CONTENT)
  refreshAllFeeds() {
    // this.minifluxService.refreshAllFeeds();
    return;
  }

  @Delete('feeds/:feedId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFeed(
    @Param('feedId') feedId: number,
    @Session() session: typeof auth.$Infer.Session,
  ) {
    return this.minifluxService.removeFeed(session.user.id, feedId);
  }

  @Get('feeds/:feedId/icon')
  getFeedIcon(@Param('feedId') feedId: number) {
    return this.minifluxService.getFeedIcon(feedId);
  }

  @Put('feeds/:feedId/mark-all-as-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markFeedAsRead(
    @Param('feedId') feedId: number,
    @Session() session: typeof auth.$Infer.Session,
  ) {
    return this.minifluxService.markFeedAsRead(session.user.id, feedId);
  }

  @Get('entries')
  @ApiQuery({
    name: 'status',
    enum: ['unread', 'read'],
    required: true,
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'order',
    enum: ['id', 'status', 'published_at', 'category_title', 'category_id'],
    required: false,
  })
  @ApiQuery({
    name: 'direction',
    enum: ['asc', 'desc'],
    required: false,
  })
  @ApiQuery({
    name: 'before',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'after',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'starred',
    type: Boolean,
    required: false,
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'category_id',
    type: Number,
    required: false,
  })
  @ZodResponse({ type: EntriesListDto, status: HttpStatus.OK })
  getEntries(
    @Query('status') status: string,
    @Query('offset') offset: number,
    @Query('limit') limit: number,
    @Session() session: UserSession,
    @Query('order') order?: string,
    @Query('direction') direction?: string,
    @Query('before') before?: number,
    @Query('after') after?: number,
    @Query('starred') starred?: boolean,
    @Query('search') search?: string,
    @Query('category_id') categoryId?: number,
  ) {
    return this.minifluxService.getEntries(
      session.user.id,
      status,
      offset,
      limit,
      order,
      direction,
      before,
      after,
      starred,
      search,
      categoryId,
    );
  }

  @Get('entries/:entryId')
  getEntry(@Param('entryId') entryId: number) {
    // return this.minifluxService.getEntry(entryId);
    return { message: 'Endpoint not implemented', entryId };
  }

  // Not supporting this endpoint right now
  // @Put('entries/:entryId')
  // @HttpCode(HttpStatus.CREATED)
  // updateEntry(
  //   @Param('entryId') entryId: number,
  //   @Body() updateEntryDto: UpdateEntryDto,
  // ) {
  //   // return this.minifluxService.updateEntry(entryId, updateEntryDto);
  //   return {
  //     message: 'Endpoint not implemented',
  //     entryId,
  //     data: updateEntryDto,
  //   };
  // }

  @Put('entries')
  @HttpCode(HttpStatus.NO_CONTENT)
  updateEntries(
    @Body() updateEntriesDto: UpdateEntriesDto,
    @Session() session: UserSession,
  ) {
    return this.minifluxService.updateEntries(
      updateEntriesDto.entry_ids,
      updateEntriesDto.status,
      session.user.id,
    );
  }

  @Post('entries/:entryId/save')
  @HttpCode(HttpStatus.ACCEPTED)
  saveEntry(
    @Param('entryId') entryId: number,
    @Session() session: UserSession,
  ) {
    this.minifluxService.saveEntry(session.user.id, entryId);
  }

  @Put('entries/:entryId/bookmark')
  @HttpCode(HttpStatus.NO_CONTENT)
  toggleBookmark(
    @Param('entryId') entryId: number,
    @Session() session: UserSession,
  ) {
    this.minifluxService.toggleBookmark(session.user.id, entryId);
  }

  @Get('entries/:entryId/fetch-content')
  fetchOriginalArticle(
    @Param('entryId') entryId: number,
    @Query('update_content') updateContent: boolean,
  ) {
    // return this.minifluxService.fetchOriginalArticle(entryId, updateContent);
    return { message: 'Endpoint not implemented', entryId, updateContent };
  }

  @Get('categories')
  @ApiQuery({ type: 'boolean', name: 'counts' })
  getCategories(
    @Query('counts') counts: boolean,
    @Session() session: typeof auth.$Infer.Session,
  ) {
    return this.minifluxService.getCategories(
      session.user.id,
      session.user.minifluxId,
      counts,
    );
  }

  @Post('categories')
  @ZodResponse({ type: CategoryOutDto, status: HttpStatus.CREATED })
  createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @Session() session: typeof auth.$Infer.Session,
  ) {
    return this.minifluxService.createCategory(
      session.user.id,
      session.user.minifluxId,
      createCategoryDto.title,
    );
  }

  @Put('categories/:categoryId')
  @ZodResponse({ type: CategoryOutDto, status: HttpStatus.CREATED })
  updateCategory(
    @Param('categoryId') categoryId: number,
    @Body() updateCategoryDto: CreateCategoryDto,
    @Session() session: typeof auth.$Infer.Session,
  ) {
    return this.minifluxService.updateCategory(
      session.user.id,
      session.user.minifluxId,
      categoryId,
      updateCategoryDto.title,
    );
  }

  @Delete('categories/:categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCategory(
    @Param('categoryId') categoryId: number,
    @Session() session: typeof auth.$Infer.Session,
  ) {
    return this.minifluxService.deleteCategory(session.user.id, categoryId);
  }

  @Get('categories/:categoryId/feeds')
  @ZodResponse({ type: [FeedMini], status: HttpStatus.OK })
  getCategoryFeeds(
    @Param('categoryId') categoryId: number,
    @Session() session: UserSession,
  ) {
    return this.minifluxService.getCategoryFeeds(categoryId, session.user.id);
  }

  @Put('categories/:categoryId/mark-all-as-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markCategoryAsRead(@Param('categoryId') categoryId: number) {
    // this.minifluxService.markCategoryAsRead(categoryId);
    return;
  }

  @Put('categories/:categoryId/refresh')
  @HttpCode(HttpStatus.NO_CONTENT)
  refreshCategoryFeeds(@Param('categoryId') categoryId: number) {
    // this.minifluxService.refreshCategoryFeeds(categoryId);
    return;
  }

  @Get('me')
  @ZodResponse({ type: UserSchemaDto, status: HttpStatus.OK })
  async getCurrentUser(@Req() request: ExpressRequest) {
    const session = await this.authService.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      throw new UnauthorizedException();
    }
    return this.minifluxService.getUserInfo(session);
  }

  @Put('users/:userId/mark-all-as-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markUserEntriesAsRead(@Param('userId') userId: number) {
    // this.minifluxService.markUserEntriesAsRead(userId);
    return;
  }

  @Get('icons/:iconId')
  getIcon(@Param('iconId') iconId: number) {
    return this.minifluxService.getIcon(iconId);
  }

  // --- API Keys ---
  @Get('api-keys')
  getApiKeys() {
    // return this.minifluxService.getApiKeys();
    return { message: 'Endpoint not implemented' };
  }

  @Post('api-keys')
  createApiKey(@Body() createApiKeyDto: CreateApiKeyDto) {
    // return this.minifluxService.createApiKey(createApiKeyDto);
    return { message: 'Endpoint not implemented', data: createApiKeyDto };
  }

  @Delete('api-keys/:apiKeyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteApiKey(@Param('apiKeyId') apiKeyId: number) {
    // this.minifluxService.deleteApiKey(apiKeyId);
    return;
  }
}
