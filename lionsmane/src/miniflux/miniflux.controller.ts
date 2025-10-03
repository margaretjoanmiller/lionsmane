import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
@Controller('miniflux')
export class MinifluxController {
  @Post('discover')
  discoverSubscriptions(@Body() discoverDto: DiscoverDto) {
    // return this.minifluxService.discover(discoverDto);
    return { message: 'Endpoint not implemented', data: discoverDto };
  }

  @Put('flush-history')
  @HttpCode(HttpStatus.ACCEPTED)
  flushHistory() {
    // return this.minifluxService.flushHistory();
    return { message: 'Endpoint not implemented' };
  }

  @Get('export')
  exportOpml() {
    // return this.minifluxService.exportOpml();
    return { message: 'Endpoint not implemented' };
  }

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  importOpml(@Body() opmlData: string) {
    // return this.minifluxService.importOpml(opmlData);
    return { message: 'Endpoint not implemented' };
  }

  @Get('version')
  getVersion() {
    // return this.minifluxService.getVersion();
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
  getFeeds() {
    // return this.minifluxService.getFeeds();
    return { message: 'Endpoint not implemented' };
  }

  @Get('feeds/counters')
  getFeedCounters() {
    // return this.minifluxService.getFeedCounters();
    return { message: 'Endpoint not implemented' };
  }

  @Get('feeds/:feedId')
  getFeed(@Param('feedId') feedId: number) {
    // return this.minifluxService.getFeed(feedId);
    return { message: 'Endpoint not implemented', feedId };
  }

  @Post('feeds')
  @HttpCode(HttpStatus.CREATED)
  createFeed(@Body() createFeedDto: CreateFeedDto) {
    // return this.minifluxService.createFeed(createFeedDto);
    return { message: 'Endpoint not implemented', data: createFeedDto };
  }

  @Put('feeds/:feedId')
  updateFeed(
    @Param('feedId') feedId: number,
    @Body() updateFeedDto: UpdateFeedDto,
  ) {
    // return this.minifluxService.updateFeed(feedId, updateFeedDto);
    return { message: 'Endpoint not implemented', feedId, data: updateFeedDto };
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
  removeFeed(@Param('feedId') feedId: number) {
    // this.minifluxService.removeFeed(feedId);
    return;
  }

  @Get('feeds/:feedId/icon')
  getFeedIcon(@Param('feedId') feedId: number) {
    // return this.minifluxService.getFeedIcon(feedId);
    return { message: 'Endpoint not implemented', feedId };
  }

  @Put('feeds/:feedId/mark-all-as-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markFeedAsRead(@Param('feedId') feedId: number) {
    // this.minifluxService.markFeedAsRead(feedId);
    return;
  }

  @Get('entries')
  getEntries(@Query() queryParams: any) {
    // return this.minifluxService.getEntries(queryParams);
    return { message: 'Endpoint not implemented', query: queryParams };
  }

  @Get('entries/:entryId')
  getEntry(@Param('entryId') entryId: number) {
    // return this.minifluxService.getEntry(entryId);
    return { message: 'Endpoint not implemented', entryId };
  }

  @Put('entries/:entryId')
  @HttpCode(HttpStatus.CREATED)
  updateEntry(
    @Param('entryId') entryId: number,
    @Body() updateEntryDto: UpdateEntryDto,
  ) {
    // return this.minifluxService.updateEntry(entryId, updateEntryDto);
    return {
      message: 'Endpoint not implemented',
      entryId,
      data: updateEntryDto,
    };
  }

  @Put('entries')
  @HttpCode(HttpStatus.NO_CONTENT)
  updateEntries(@Body() updateEntriesDto: UpdateEntriesDto) {
    // this.minifluxService.updateEntries(updateEntriesDto);
    return;
  }

  @Post('entries/:entryId/save')
  @HttpCode(HttpStatus.ACCEPTED)
  saveEntry(@Param('entryId') entryId: number) {
    // this.minifluxService.saveEntry(entryId);
    return;
  }

  @Put('entries/:entryId/bookmark')
  @HttpCode(HttpStatus.NO_CONTENT)
  toggleBookmark(@Param('entryId') entryId: number) {
    // this.minifluxService.toggleBookmark(entryId);
    return;
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
  getCategories(@Query('counts') counts: boolean) {
    // return this.minifluxService.getCategories(counts);
    return { message: 'Endpoint not implemented', counts };
  }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    // return this.minifluxService.createCategory(createCategoryDto);
    return { message: 'Endpoint not implemented', data: createCategoryDto };
  }

  @Put('categories/:categoryId')
  updateCategory(
    @Param('categoryId') categoryId: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    // return this.minifluxService.updateCategory(categoryId, updateCategoryDto);
    return {
      message: 'Endpoint not implemented',
      categoryId,
      data: updateCategoryDto,
    };
  }

  @Delete('categories/:categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCategory(@Param('categoryId') categoryId: number) {
    // this.minifluxService.deleteCategory(categoryId);
    return;
  }

  @Get('categories/:categoryId/feeds')
  getCategoryFeeds(@Param('categoryId') categoryId: number) {
    // return this.minifluxService.getCategoryFeeds(categoryId);
    return { message: 'Endpoint not implemented', categoryId };
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
  getCurrentUser() {
    // return this.minifluxService.getCurrentUser();
    return { message: 'Endpoint not implemented' };
  }

  @Get('users')
  getUsers() {
    // return this.minifluxService.getUsers();
    return { message: 'Endpoint not implemented' };
  }

  @Get('users/:userId')
  getUser(@Param('userId') userId: string) {
    // return this.minifluxService.getUser(userId);
    return { message: 'Endpoint not implemented', userId };
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  createUser(@Body() createUserDto: CreateUserDto) {
    // return this.minifluxService.createUser(createUserDto);
    return { message: 'Endpoint not implemented', data: createUserDto };
  }

  @Put('users/:userId')
  updateUser(
    @Param('userId') userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // return this.minifluxService.updateUser(userId, updateUserDto);
    return { message: 'Endpoint not implemented', userId, data: updateUserDto };
  }

  @Delete('users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUser(@Param('userId') userId: number) {
    // this.minifluxService.deleteUser(userId);
    return;
  }

  @Put('users/:userId/mark-all-as-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markUserEntriesAsRead(@Param('userId') userId: number) {
    // this.minifluxService.markUserEntriesAsRead(userId);
    return;
  }

  @Get('icons/:iconId')
  getIcon(@Param('iconId') iconId: number) {
    // return this.minifluxService.getIcon(iconId);
    return { message: 'Endpoint not implemented', iconId };
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
