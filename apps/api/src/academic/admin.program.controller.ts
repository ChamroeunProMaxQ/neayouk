import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DefaultActions, UseAbility } from 'nest-casl';
import { UserTypeEnum } from '@repo/contracts';
import { JwtAuthGuard } from '@src/auth/jwt-auth.guard.js';
import { CaslAccessGuard } from '@src/common/guard/casl-access.guard.js';
import { UserTypesGuard } from '@src/common/guard/user-types.guard.js';
import { UserTypes } from '@src/common/decorator/user-type.decorator.js';
import { ProgramService } from './program.service.js';
import { Program } from './entity/program.entity.js';
import {
  CreateProgramDto,
  UpdateProgramDto,
  FindProgramsDto,
} from './dto/program.dto.js';

@ApiTags('Admin Programs')
@ApiBearerAuth()
@Controller('admin/programs')
export class AdminProgramController {
  constructor(private readonly programService: ProgramService) {}

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN)
  @UseAbility(DefaultActions.read, Program)
  @Get()
  findAll(@Query() dto: FindProgramsDto) {
    return this.programService.findAll(dto);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.read, Program)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.programService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.create, Program)
  @Post()
  create(@Body() dto: CreateProgramDto) {
    return this.programService.create(dto);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.update, Program)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProgramDto,
  ) {
    return this.programService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.delete, Program)
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.programService.delete(id);
  }
}
