import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { Response } from 'express';
import { GreaderService } from './greader.service';

@ApiTags('greader')
@Controller('greader')
export class GreaderController {
  constructor(private greaderService: GreaderService) {}

  @Get('api/0/tag/list')
  @ApiQuery({
    name: 'output',
    default: 'json',
    description: 'output format (json only for now)',
  })
  listFolders(@Session() session: UserSession) {
    return this.greaderService.getTags(session.user.id);
  }

  @Post('api/0/rename-tag')
  @ApiQuery({
    name: 's',
    required: false,
    description: 'stream id',
  })
  @ApiQuery({
    name: 't',
    required: false,
    description: 'tag name',
  })
  @ApiQuery({
    name: 'dest',
    required: true,
    description: 'new tag name',
  })
  @ApiResponse({ description: 'Tag renamed', status: 200 })
  async renameFolder(
    @Session() session: UserSession,
    @Query('s') streamId: string,
    @Query('t') tagName: string,
    @Query('dest') dest: string,
    @Res() res: Response,
  ) {
    await this.greaderService.renameTag(
      session.user.id,
      streamId,
      tagName,
      dest,
    );
    return res.status(200).type('text').send('OK');
  }

  @Post('api/0/disable-tag')
  deleteFolder() {
    return 'not implemented';
  }

  @Get('api/0/unread-count')
  @ApiQuery({
    name: 'output',
    default: 'json',
    description: 'output format (json only for now)',
  })
  unreadCount() {
    return 'not implemented';
  }

  @Get('api/0/subscription/list')
  @ApiQuery({
    name: 'output',
    default: 'json',
    description: 'output format (json only for now)',
  })
  subscriptionList() {
    return 'not implemened';
  }

  @Get('subscriptions/export')
  opmlExport() {
    return 'not implemeneted';
  }

  @Post('api/0/subscription/quickadd')
  @ApiQuery({
    name: 'quickadd',
    required: true,
    description: 'Url to subscribe to',
  })
  quickAdd() {
    return 'not implemented';
  }

  @Post('api/0/subscription/edit')
  @ApiQuery({
    name: 'ac',
    default: 'edit',
    description: 'action',
  })
  @ApiQuery({
    name: 's',
    required: true,
    description: 'stream ID (feed/<feed ID>)',
  })
  @ApiQuery({
    name: 't',
    required: false,
    description: 'title',
  })
  @ApiQuery({
    name: 'a',
    required: false,
    description: 'move to folder',
  })
  @ApiQuery({
    name: 'r',
    required: false,
    description: 'remove from folder',
  })
  editFeed() {
    return 'not implemented';
  }

  @Post('api/0/subscription/edit')
  @ApiQuery({
    name: 'ac',
    default: 'unsubscribe',
    description: 'action',
  })
  @ApiQuery({
    name: 's',
    required: true,
    description: 'stream ID (feed/<feed ID>)',
  })
  deleteFeed() {
    return 'not implemented';
  }

  @Get('api/0/stream/items/ids')
  @ApiQuery({
    name: 's',
    required: false,
    description: 'filter by stream',
  })
  @ApiQuery({
    name: 'xt',
    required: false,
    description: 'exclude items',
  })
  @ApiQuery({
    name: 'n',
    required: false,
    description: 'page limit',
  })
  @ApiQuery({
    name: 'output',
    default: 'json',
    description: 'output format (json only for now)',
  })
  getItemIds() {
    return 'not implemented';
  }

  @Get('api/0/stream/items/contents')
  @ApiQuery({
    name: 's',
    required: false,
    description: 'filter by stream',
  })
  @ApiQuery({
    name: 'xt',
    required: false,
    description: 'exclude items',
  })
  @ApiQuery({
    name: 'n',
    required: false,
    description: 'page limit',
  })
  @ApiQuery({
    name: 'output',
    default: 'json',
    description: 'output format (json only for now)',
  })
  getItemContents() {
    return 'not implemented';
  }

  @Post('api/0/mark-all-as-read')
  @ApiQuery({
    name: 's',
    required: true,
    description: 'filter by stream',
  })
  @ApiQuery({
    name: 'ts',
    required: false,
    description: 'older than timestamp in nanoseconds',
  })
  markRead() {
    return 'not implemented';
  }

  @Post('api/0/edit-tag')
  @ApiQuery({
    name: 'i',
    required: true,
    description: 'item ids',
  })
  @ApiQuery({
    name: 'a',
    required: true,
    description: 'action or state to apply',
  })
  editItem() {
    return 'not implemented';
  }
}
