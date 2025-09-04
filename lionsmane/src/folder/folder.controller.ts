import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FolderService } from './folder.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import {
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOAuth2,
} from '@nestjs/swagger';
import { FolderOutDto } from './dto/folder-out.dto';
import { ZodResponse } from 'nestjs-zod';

@ApiTags('folders')
@ApiCookieAuth()
@ApiBearerAuth()
@ApiOAuth2(['openid', 'profile', 'email'])
@Controller('folder')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Post()
  @ZodResponse({ type: FolderOutDto, status: 201 })
  create(
    @Body() createFolderDto: CreateFolderDto,
    @Session() session: UserSession,
  ) {
    return this.folderService.create(createFolderDto, session.user.id);
  }

  @Get()
  @ZodResponse({ type: [FolderOutDto], status: 200 })
  findAll(@Session() session: UserSession) {
    return this.folderService.findAll(session.user.id);
  }

  @Get(':id')
  @ZodResponse({ type: FolderOutDto, status: 200 })
  findOne(@Param('id') id: string, @Session() session: UserSession) {
    return this.folderService.findOne(id, session.user.id);
  }

  @Patch(':id')
  @ZodResponse({ type: FolderOutDto, status: 200 })
  update(
    @Param('id') id: string,
    @Body() updateFolderDto: UpdateFolderDto,
    @Session() session: UserSession,
  ) {
    return this.folderService.update(id, updateFolderDto, session.user.id);
  }

  @Delete(':id')
  @ApiResponse({ status: 204, description: 'Folder deleted successfully.' })
  remove(@Param('id') id: string, @Session() session: UserSession) {
    return this.folderService.remove(id, session.user.id);
  }
}
