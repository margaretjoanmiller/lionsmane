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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FilterOutDto } from './dto/filter-out.dto';
import { ZodResponse } from 'nestjs-zod';

@ApiTags('filter')
@ApiCookieAuth()
@ApiBearerAuth()
@ApiOAuth2(['openid', 'profile', 'email'])
@Controller('filter')
export class FilterController {
  constructor(private readonly filterService: FilterService) {}

  @Post()
  @ZodResponse({ type: FilterOutDto, status: 201 })
  create(
    @Body() createFilterDto: CreateFilterDto,
    @Session() session: UserSession,
  ) {
    return this.filterService.create(session.user.id, createFilterDto);
  }

  @Get()
  @ZodResponse({ type: [FilterOutDto], status: 200 })
  findAll(@Session() session: UserSession) {
    return this.filterService.findAll(session.user.id);
  }

  @Get(':id')
  @ZodResponse({ type: FilterOutDto, status: 200 })
  findOne(@Param('id') id: string, @Session() session: UserSession) {
    return this.filterService.findOne(id, session.user.id);
  }

  @Patch(':id')
  @ZodResponse({ type: FilterOutDto, status: 200 })
  update(
    @Param('id') id: string,
    @Body() updateFilterDto: UpdateFilterDto,
    @Session() session: UserSession,
  ) {
    return this.filterService.update(id, session.user.id, updateFilterDto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Filter deleted successfully' })
  remove(@Param('id') id: string, @Session() session: UserSession) {
    return this.filterService.remove(id, session.user.id);
  }
}
