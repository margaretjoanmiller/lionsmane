import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiPreconditionFailedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { ReadlaterService } from './readlater.service';
import { CreateConfigDto } from './dto/create-config.dto';

@ApiTags('readlater')
@Controller('readlater')
export class ReadlaterController {
  constructor(private readlater: ReadlaterService) {}

  @Post('configure')
  @ApiCreatedResponse({ description: 'Created readlater configuration' })
  async createConfig(
    @Body() body: CreateConfigDto,
    @Session() session: UserSession,
  ) {
    return await this.readlater.addApiKeyAndUrl(
      session.user.id,
      body.apiKey,
      new URL(body.apiURL),
    );
  }

  @Post()
  @ApiCreatedResponse({ description: 'Readlater item created' })
  @ApiPreconditionFailedResponse({
    description: 'Readlater service not configured',
  })
  async addBookmark(
    @Body() body: CreateBookmarkDto,
    @Session() session: UserSession,
  ) {
    return await this.readlater.addBookmark(new URL(body.url), session.user.id);
  }
}
