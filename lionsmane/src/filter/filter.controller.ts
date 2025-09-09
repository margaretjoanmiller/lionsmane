import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FilterService } from './filter.service';
import { CreateFilterDto } from './dto/create-filter.dto';
import { UpdateFilterDto } from './dto/update-filter.dto';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOAuth2,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('filter')
@ApiCookieAuth()
@ApiBearerAuth()
@ApiOAuth2(['openid', 'profile', 'email'])
@Controller('filter')
export class FilterController {
  constructor(private readonly filterService: FilterService) {}

  @Post()
  create(
    @Body() createFilterDto: CreateFilterDto,
    @Session() session: UserSession,
  ) {
    return this.filterService.create(session.user.id, createFilterDto);
  }

  @Get()
  findAll(@Session() session: UserSession) {
    return this.filterService.findAll(session.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Session() session: UserSession) {
    return this.filterService.findOne(id, session.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFilterDto: UpdateFilterDto,
    @Session() session: UserSession,
  ) {
    return this.filterService.update(id, session.user.id, updateFilterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Session() session: UserSession) {
    return this.filterService.remove(id, session.user.id);
  }
}
