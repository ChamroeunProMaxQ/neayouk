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
import { ClassService } from './class.service.js';
import { Class } from './entity/class.entity.js';
import { ClassTimetable } from './entity/class-timetable.entity.js';
import {
  CreateClassDto,
  UpdateClassDto,
  FindClassesDto,
  CreateClassTimetableDto,
  UpdateClassTimetableDto,
  FindClassTimetablesDto,
} from './dto/class.dto.js';

@ApiTags('Admin Classes')
@ApiBearerAuth()
@Controller('admin/classes')
export class AdminClassController {
  constructor(private readonly classService: ClassService) {}

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN, UserTypeEnum.SUPER_ADMIN)
  @UseAbility(DefaultActions.read, Class)
  @Get()
  findAll(
    @Query() dto: FindClassesDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.classService.findAll(dto, currentUser);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.read, Class)
  @Get('academic-years/summary')
  getAcademicYearsSummary(@CurrentUser() currentUser: any) {
    return this.classService.getAcademicYearsSummary(currentUser);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.read, Class)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.classService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.create, Class)
  @Post()
  create(
    @Body() dto: CreateClassDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.classService.create(dto, currentUser);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.update, Class)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClassDto) {
    return this.classService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.delete, Class)
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.classService.delete(id);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.read, Class)
  @Get(':id/students')
  getStudents(@Param('id', ParseIntPipe) id: number) {
    return this.classService.getStudents(id);
  }

  // Class Timetable Sub-routes
  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.read, ClassTimetable)
  @Get(':id/timetable')
  getTimetable(
    @Param('id', ParseIntPipe) id: number,
    @Query() dto: FindClassTimetablesDto,
  ) {
    return this.classService.getTimetable(id, dto);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.create, ClassTimetable)
  @Post(':id/timetable')
  createTimetableSlot(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateClassTimetableDto,
  ) {
    return this.classService.createTimetableSlot(id, dto);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.update, ClassTimetable)
  @Patch('timetable/:slotId')
  updateTimetableSlot(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body() dto: UpdateClassTimetableDto,
  ) {
    return this.classService.updateTimetableSlot(slotId, dto);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.delete, ClassTimetable)
  @Delete('timetable/:slotId')
  deleteTimetableSlot(@Param('slotId', ParseIntPipe) slotId: number) {
    return this.classService.deleteTimetableSlot(slotId);
  }
}
