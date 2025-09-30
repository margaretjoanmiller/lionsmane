import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOAuth2,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { ZodResponse } from 'nestjs-zod';
import { FeedListOutDto, FeedOutDto } from './dto/feed-out.dto';
import { FileDto } from './dto/file.dto';
import {
  DiscoverDto,
  DiscoveredFeedsDto,
  NewSubscriptionDto,
} from './dto/new-subscription.dto';
import { SubscribeFeedDto } from './dto/subscribe-feed.dto';
import { SubscriptionOutDto } from './dto/subscription-out.dto';
import { UpdateFeedDto } from './dto/update-feed.dto';
import { FeedService } from './feed.service';

@ApiTags('feeds')
@ApiCookieAuth()
@ApiBearerAuth()
@ApiOAuth2(['openid', 'profile', 'email'])
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  private readonly logger = new Logger(FeedController.name);

  @Post()
  @ZodResponse({ type: NewSubscriptionDto, status: 201 })
  async create(
    @Body() newSubscription: SubscribeFeedDto,
    @Session() session: UserSession,
  ) {
    return await this.feedService.create(newSubscription, session.user.id);
  }

  @Get()
  @ZodResponse({ type: FeedListOutDto, status: 200 })
  async findAll(@Session() session: UserSession) {
    return { feeds: await this.feedService.findAll(session.user.id) };
  }

  @Post('discover')
  @ZodResponse({ type: DiscoveredFeedsDto, status: 200 })
  async discover(@Body() url: DiscoverDto, @Session() session: UserSession) {
    return await this.feedService.discover(url.url);
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

  @Post('mark-all-read/:id')
  async markAllRead(@Param('id') id: string, @Session() session: UserSession) {
    return await this.feedService.markAllRead(session.user.id, id);
  }

  @Get(':id')
  @ZodResponse({ type: FeedOutDto, status: 200 })
  findOne(@Param('id') id: string, @Session() session: UserSession) {
    return this.feedService.findOne(id, session.user.id);
  }

  @Delete(':id')
  @ApiResponse({ status: 204, description: 'Feed unsubscribed' })
  remove(@Param('id') id: string, @Session() session: UserSession) {
    return this.feedService.remove(id, session.user.id);
  }

  @Patch(':id')
  @ZodResponse({ type: SubscriptionOutDto, status: 200 })
  update(
    @Param('id') id: string,
    @Body() updateFeedDto: UpdateFeedDto,
    @Session() session: UserSession,
  ) {
    return this.feedService.update(id, session.user.id, updateFeedDto);
  }
}
