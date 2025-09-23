import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Post,
  Query,
  Request,
  Res,
  StreamableFile,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService, Public } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request as ExpressRequest, Response } from 'express';
import { auth } from 'src/auth';
import { FeedService } from 'src/feed/feed.service';
import { LoginApiDto } from './dto/login.dto';
import { GreaderService } from './greader.service';

@ApiTags('greader')
@Public()
@Controller('greader')
export class GreaderController {
  constructor(
    private greaderService: GreaderService,
    private authService: AuthService<typeof auth>,
    private feedService: FeedService,
  ) {}

  private readonly logger = new Logger(GreaderController.name);

  private async greaderKey(req: ExpressRequest) {
    const key = req.get('Authorization')?.replace('GoogleLogin auth=', '');
    if (!key) {
      throw new UnauthorizedException('No API key provided');
    }
    return await this.authService.api.getSession({
      headers: new Headers({
        'x-api-key': key,
      }),
    });
  }

  @Get('accounts/ClientLogin')
  @ApiQuery({ name: 'Email', required: true })
  @ApiQuery({ name: 'Passwd', required: true })
  async getTokenGET(
    @Query('Email') email: string,
    @Query('Passwd') password: string,
    @Request() req: ExpressRequest,
    @Res() res: Response,
  ) {
    const session = await this.authService.api.signInEmail({
      body: {
        email: email,
        password: password,
      },
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const key = await this.authService.api.createApiKey({
      body: {
        userId: session.user.id,
        rateLimitTimeWindow: 1000 * 60 * 60 * 24, // 1 day
        rateLimitMax: 200, // 200 requests per day
      },
      headers: fromNodeHeaders(req.headers),
    });
    return res
      .status(200)
      .type('text')
      .send(`SID=none\nLSID=none\nAuth=${key.key}\n`);
  }

  @Post('accounts/ClientLogin')
  async getTokenPost(
    @Body() login: LoginApiDto,
    @Request() req: ExpressRequest,
    @Res() res: Response,
  ) {
    const session = await this.authService.api.signInEmail({
      body: {
        email: login.Email,
        password: login.Passwd,
      },
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const key = await this.authService.api.createApiKey({
      body: {
        userId: session.user.id,
        rateLimitTimeWindow: 1000 * 60 * 60 * 24, // 1 day
        rateLimitMax: 200, // 200 requests per day
      },
      headers: fromNodeHeaders(req.headers),
    });
    return res
      .status(200)
      .type('text')
      .send(`SID=none\nLSID=none\nAuth=${key.key}\n`);
  }

  @Get('reader/api/0/tag/list')
  @ApiQuery({
    name: 'output',
    default: 'json',
    description: 'output format (json only for now)',
  })
  async listFolders(@Request() req: ExpressRequest) {
    const session = await this.greaderKey(req);
    return this.greaderService.getTags(session.user.id);
  }

  @Post('reader/api/0/rename-tag')
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
    @Query('s') streamId: string,
    @Query('t') tagName: string,
    @Query('dest') dest: string,
    @Request() req: ExpressRequest,
    @Res() res: Response,
  ) {
    const session = await this.greaderKey(req);
    await this.greaderService.renameTag(
      session.user.id,
      streamId,
      tagName,
      dest,
    );
    return res.status(200).type('text').send('OK');
  }

  @Post('reader/api/0/disable-tag')
  async deleteFolder(
    @Query('s') streamId: string,
    @Query('t') tagName: string,
    @Request() req: ExpressRequest,
    @Res() res: Response,
  ) {
    const session = await this.greaderKey(req);
    await this.greaderService.deleteFolder(session.user.id, streamId, tagName);
    return res.status(200).type('text').send('OK');
  }

  @Get('reader/api/0/unread-count')
  @ApiQuery({
    name: 'output',
    default: 'json',
    description: 'output format (json only for now)',
  })
  async unreadCount(@Request() req: ExpressRequest) {
    const session = await this.greaderKey(req);
    return await this.greaderService.unreadCounts(session.user.id);
  }

  @Get('reader/api/0/subscription/list')
  @ApiQuery({
    name: 'output',
    default: 'json',
    description: 'output format (json only for now)',
  })
  async subscriptionListOld(@Request() req: ExpressRequest) {
    const session = await this.greaderKey(req);
    return await this.greaderService.subscriptionList(session.user.id);
  }

  @Get('subscriptions/export')
  @ApiResponse({ status: 200, description: 'OPML file exported' })
  async opmlExport(@Request() req: ExpressRequest) {
    const session = await this.greaderKey(req);
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

  @Post('reader/api/0/subscription/quickadd')
  @ApiQuery({
    name: 'quickadd',
    required: true,
    description: 'Url to subscribe to',
  })
  async quickAdd(
    @Query('quickadd') quickadd: string,
    @Request() req: ExpressRequest,
  ) {
    const session = await this.greaderKey(req);
    const sub = await this.feedService.create(
      { url: quickadd, folderId: null },
      session.user.id,
    );
    return {
      numResults: 1,
      query: sub.url,
      streamId: `feed/${sub.url}`,
    };
  }

  @Post('reader/api/0/subscription/edit')
  @ApiQuery({
    name: 'ac',
    required: true,
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
  async editFeed(
    @Query('ac') action: string,
    @Query('s') streamId: string,
    @Query('a') addFolder: string | undefined,
    @Query('r') removeFolder: string | undefined,
    @Request() req: ExpressRequest,
  ) {
    const session = await this.greaderKey(req);
    return await this.greaderService.editFeed(
      action,
      session.user.id,
      streamId,
      removeFolder,
      addFolder,
    );
  }

  @Get('reader/api/0/stream/items/ids')
  @ApiQuery({
    name: 's',
    required: false,
    description: 'filter by stream',
  })
  @ApiQuery({
    name: 'c',
    required: false,
    description: 'continuation string (cursor for paging)',
  })
  @ApiQuery({
    name: 'xt',
    required: false,
    description: 'exclude items',
  })
  @ApiQuery({
    name: 'n',
    required: true,
    default: 1000,
    description: 'page limit',
  })
  @ApiQuery({
    name: 'output',
    default: 'json',
    description: 'output format (json only for now)',
  })
  async getItemIds(
    @Query('s') streamId: string,
    @Query('c') continuation: string | undefined,
    @Query('xt') excludeItems: string | undefined,
    @Query('n') pageLimit: number,
    @Request() req: ExpressRequest,
  ) {
    const session = await this.greaderKey(req);
    return await this.greaderService.getItemIds(
      session.user.id,
      streamId,
      pageLimit,
      continuation,
      excludeItems,
    );
  }

  @Get('reader/api/0/stream/items/contents')
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
  async getItemContents(
    @Query('s') streamId: string,
    @Query('c') continuation: string | undefined,
    @Query('xt') excludeItems: string | undefined,
    @Query('n') pageLimit: number,
    @Request() req: ExpressRequest,
  ) {
    const session = await this.greaderKey(req);
    return await this.greaderService.getItemContents(
      session.user.id,
      streamId,
      pageLimit,
      continuation,
      excludeItems,
    );
  }

  @Post('reader/api/0/mark-all-as-read')
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
  markRead(@Request() req: ExpressRequest) {
    const session = this.greaderKey(req);
    return 'not implemented';
  }

  @Post('reader/api/0/edit-tag')
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
  editItem(@Request() req: ExpressRequest) {
    const session = this.greaderKey(req);
    return 'not implemented';
  }

  @Get('/reader/api/0/friend/list')
  async getFriends(@Request() req: ExpressRequest) {
    const session = await this.greaderKey(req);
    return {
      friends: [
        {
          p: '',
          contactId: '-1',
          flags: session.user.id,
          stream: `user/${session.user.id}/state/com.google/broadcast`,
          hasSharedItemsOnProfile: false,
          profileIds: [session.user.id],
          userIds: [session.user.id],
          givenName: session.user.name || session.user.email || 'User',
          displayName: session.user.name || session.user.email || 'User',
          n: '',
        },
      ],
    };
  }
}
