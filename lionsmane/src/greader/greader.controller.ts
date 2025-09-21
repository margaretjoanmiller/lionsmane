import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService, Public } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request as ExpressRequest, Response } from 'express';
import { auth } from 'src/auth';
import { LoginApiDto } from './dto/login.dto';
import { GreaderService } from './greader.service';

@ApiTags('greader')
@Public()
@Controller('greader')
export class GreaderController {
  constructor(
    private greaderService: GreaderService,
    private authService: AuthService<typeof auth>,
  ) {}

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

  @Post('accounts/ClientLogin')
  async getToken(
    @Body() login: LoginApiDto,
    @Request() req: ExpressRequest,
    @Res() res: Response,
  ) {
    const session = await this.authService.api.signInEmail({
      body: {
        email: login.email,
        password: login.password,
      },
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const key = await this.authService.api.createApiKey({
      body: {
        userId: session.user.id,
      },
      headers: fromNodeHeaders(req.headers),
    });
    return res
      .status(200)
      .type('text')
      .send(`SID=none\nLSID=none\nAuth=${key.key}\n`);
  }

  @Get('api/0/tag/list')
  @ApiQuery({
    name: 'output',
    default: 'json',
    description: 'output format (json only for now)',
  })
  async listFolders(@Request() req: ExpressRequest) {
    const session = await this.greaderKey(req);
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

  @Post('api/0/disable-tag')
  async deleteFolder(
    @Query('s') streamId: string,
    @Query('t') tagName: string,
    @Request() req: ExpressRequest,
    @Res() res: Response,
  ) {
    const session = await this.greaderKey(req);
    await this.greaderService.deleteFeed(session.user.id, streamId, tagName);
    return res.status(200).type('text').send('OK');
  }

  @Get('api/0/unread-count')
  @ApiQuery({
    name: 'output',
    default: 'json',
    description: 'output format (json only for now)',
  })
  async unreadCount(@Request() req: ExpressRequest) {
    const session = await this.greaderKey(req);
    return await this.greaderService.unreadCounts(session.user.id);
  }

  @Get('api/0/subscription/list')
  @ApiQuery({
    name: 'output',
    default: 'json',
    description: 'output format (json only for now)',
  })
  async subscriptionList(@Request() req: ExpressRequest) {
    const session = await this.greaderKey(req);
    return await this.greaderService.subscriptionList(session.user.id);
  }

  @Get('subscriptions/export')
  opmlExport(@Request() req: ExpressRequest) {
    const session = this.greaderKey(req);
    return 'not implemeneted';
  }

  @Post('api/0/subscription/quickadd')
  @ApiQuery({
    name: 'quickadd',
    required: true,
    description: 'Url to subscribe to',
  })
  quickAdd(@Request() req: ExpressRequest) {
    const session = this.greaderKey(req);
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
  editFeed(@Request() req: ExpressRequest) {
    const session = this.greaderKey(req);
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
  deleteFeed(@Request() req: ExpressRequest) {
    const session = this.greaderKey(req);
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
  getItemIds(@Request() req: ExpressRequest) {
    const session = this.greaderKey(req);
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
  getItemContents(@Request() req: ExpressRequest) {
    const session = this.greaderKey(req);
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
  markRead(@Request() req: ExpressRequest) {
    const session = this.greaderKey(req);
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
  editItem(@Request() req: ExpressRequest) {
    const session = this.greaderKey(req);
    return 'not implemented';
  }
}
