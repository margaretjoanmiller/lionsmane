import { Controller, Get, Post } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('greader')
@Controller('greader')
export class GreaderController {
  @Get('api/0/tag/list?output=json')
  listFolders() {
    return 'not implemented;';
  }

  @Post('api/0/rename-tag')
  renameFolder() {
    return 'not implemented';
  }

  @Post('api/0/disable-tag')
  deleteFolder() {
    return 'not implemented';
  }

  @Get('api/0/unread-count?output=json')
  unreadCount() {
    return 'not implemented';
  }

  @Get('api/0/subscription/list?output=json')
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

  @Post('api/0/subscription/edit?ac=edit')
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

  @Post('api/0/subscription/edit?ac=unsubscribe')
  @ApiQuery({
    name: 's',
    required: true,
    description: 'stream ID (feed/<feed ID>)',
  })
  deleteFeed() {
    return 'not implemented';
  }

  @Get('api/0/stream/items/ids?output=json')
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
  getItemIds() {
    return 'not implemented';
  }

  @Get('api/0/stream/items/contents?output=json')
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
