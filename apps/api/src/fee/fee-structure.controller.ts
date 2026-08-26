import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UseAbility } from 'nest-casl';
import { Actions } from 'nest-casl';
import { UserTypeEnum } from '@repo/contracts';
import { JwtAuthGuard } from '@src/auth/jwt-auth.guard.js';
import { CaslAccessGuard } from '@src/common/guard/casl-access.guard.js';
import { UserTypesGuard } from '@src/common/guard/user-types.guard.js';
import { UserTypes } from '@src/common/decorator/user-type.decorator.js';

import { FeeStructure } from './entity/fee-structure.entity.js';
import { FeeStructureService } from './fee-structure.service.js';
import {
  CreateFeeStructureDto,
  UpdateFeeStructureDto,
  FindFeeStructuresDto,
} from './dto/fee.dto.js';

@Controller('admin/fees/structures')
@UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
@UserTypes(UserTypeEnum.ADMIN, UserTypeEnum.CMS)
export class FeeStructureController {
  constructor(private readonly service: FeeStructureService) {}

  @Get()
  @UseAbility(Actions.read, FeeStructure)
  async findAll(@Query() query: FindFeeStructuresDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @UseAbility(Actions.read, FeeStructure)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @UseAbility(Actions.create, FeeStructure)
  async create(@Body() dto: CreateFeeStructureDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @UseAbility(Actions.update, FeeStructure)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFeeStructureDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseAbility(Actions.delete, FeeStructure)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
  }
}
