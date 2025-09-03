import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { FeedService } from './feed.service';
import { SubscribeFeedDto } from './dto/subscribe-feed.dto';
import { ApiTags } from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('feeds')
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
  findAll(@Session() session: UserSession) {
    return this.feedService.findAll(session.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Session() session: UserSession) {
    return this.feedService.findOne(id, session.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Session() session: UserSession) {
    return this.feedService.remove(id, session.user.id);
  }
}
