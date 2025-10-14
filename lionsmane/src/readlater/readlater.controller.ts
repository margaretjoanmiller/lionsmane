import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiPreconditionFailedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { CreateConfigDto } from './dto/create-config.dto';
import { ReadlaterService } from './readlater.service';

@ApiTags('readlater')
@Controller('readlater')
export class ReadlaterController {
  constructor(private readlater: ReadlaterService) {}

  @Post('configure')
  @ApiCreatedResponse({ description: 'Created readlater configuration' })
  createConfig(@Body() body: CreateConfigDto, @Session() session: UserSession) {
    return this.readlater.addApiKeyAndUrl(
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
  addBookmark(
    @Body() body: CreateBookmarkDto,
    @Session() session: UserSession,
  ) {
    return this.readlater.addBookmark(new URL(body.url), session.user.id);
  }
}
