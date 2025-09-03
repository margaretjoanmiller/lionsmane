import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { FeedService } from './feed.service';
import { SubscribeFeedDto } from './dto/subscribe-feed.dto';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOAuth2,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { ZodResponse } from 'nestjs-zod';
import { FeedListOutDto, FeedOutDto } from './dto/feed-out.dto';

@ApiTags('feeds')
@ApiCookieAuth()
@ApiBearerAuth()
@ApiOAuth2(['openid', 'profile', 'email'])
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Post()
  create(
    @Body() newSubscription: SubscribeFeedDto,
    @Session() session: UserSession,
  ) {
    return this.feedService.create(newSubscription, session.user.id);
  }

  @Get()
  @ZodResponse({ type: FeedListOutDto })
  findAll(@Session() session: UserSession) {
    return this.feedService.findAll(session.user.id);
  }

  @Get(':id')
  @ZodResponse({ type: FeedOutDto })
  findOne(@Param('id') id: string, @Session() session: UserSession) {
    return this.feedService.findOne(id, session.user.id);
  }

  @Delete(':id')
  @ApiResponse({ status: 204, description: 'Feed unsubscribed' })
  remove(@Param('id') id: string, @Session() session: UserSession) {
    return this.feedService.remove(id, session.user.id);
  }
}
