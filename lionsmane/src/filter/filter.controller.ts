import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FilterService } from './filter.service';
import { CreateFilterDto } from './dto/create-filter.dto';
import { UpdateFilterDto } from './dto/update-filter.dto';

@Controller('filter')
export class FilterController {
  constructor(private readonly filterService: FilterService) {}

  @Post()
  create(@Body() createFilterDto: CreateFilterDto) {
    return this.filterService.create(createFilterDto);
  }

  @Get()
  findAll() {
    return this.filterService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filterService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFilterDto: UpdateFilterDto) {
    return this.filterService.update(+id, updateFilterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.filterService.remove(+id);
  }
}
