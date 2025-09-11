import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOAuth2,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { ZodResponse } from 'nestjs-zod';
import { CreateFolderDto } from './dto/create-folder.dto';
import { FolderOutDto, FolderWithFeedsOutDto } from './dto/folder-out.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { FolderService } from './folder.service';

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

  @Get('feeds')
  @ZodResponse({ type: [FolderWithFeedsOutDto], status: 200 })
  async findAllWithFeeds(@Session() session: UserSession) {
    return await this.folderService.findAllWithFeeds(session.user.id);
  }

  @Get(':id')
  @ZodResponse({ type: FolderOutDto, status: 200 })
  async findOne(@Param('id') id: string, @Session() session: UserSession) {
    return await this.folderService.findOne(id, session.user.id);
  }

  @Patch(':id')
  @ZodResponse({ type: FolderOutDto, status: 200 })
  async update(
    @Param('id') id: string,
    @Body() updateFolderDto: UpdateFolderDto,
    @Session() session: UserSession,
  ) {
    return await this.folderService.update(
      id,
      updateFolderDto,
      session.user.id,
    );
  }

  @Delete(':id')
  @ApiResponse({ status: 204, description: 'Folder deleted successfully.' })
  async remove(@Param('id') id: string, @Session() session: UserSession) {
    return await this.folderService.remove(id, session.user.id);
  }
}
