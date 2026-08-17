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
import { CurrentUser } from '@src/common/decorator/current-user.decorator.js';
import { TeacherService } from './teacher.service.js';
import { Teacher } from './entity/teacher.entity.js';
import { TeacherHook } from './teacher.hook.js';
import { CreateTeacherDto } from './dto/create-teacher.dto.js';
import { UpdateTeacherDto } from './dto/update-teacher.dto.js';
import { FindTeachersDto } from './dto/find-teachers.dto.js';

@ApiTags('Admin Teachers')
@ApiBearerAuth()
@Controller('admin/teachers')
export class AdminTeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN)
  @UseAbility(DefaultActions.read, Teacher)
  @Get()
  findAll(@Query() dto: FindTeachersDto) {
    return this.teacherService.findAll(dto);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.read, Teacher, TeacherHook)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teacherService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.read, Teacher, TeacherHook)
  @Get(':id/classes')
  getAssignedClasses(@Param('id', ParseIntPipe) id: number) {
    return this.teacherService.getAssignedClasses(id);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.create, Teacher)
  @Post()
  create(
    @Body() dto: CreateTeacherDto,
    @CurrentUser('sub') currentUserId: number,
  ) {
    return this.teacherService.create(dto, currentUserId);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.update, Teacher, TeacherHook)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeacherDto,
    @CurrentUser('sub') currentUserId: number,
  ) {
    return this.teacherService.update(id, dto, currentUserId);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.delete, Teacher, TeacherHook)
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.teacherService.delete(id);
  }
}
