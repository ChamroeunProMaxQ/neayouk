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
import { StudentAttendanceService } from './student-attendance.service.js';
import { TeacherAttendanceService } from './teacher-attendance.service.js';
import { LeaveRequestService } from './leave-request.service.js';
import { StudentAttendance } from './entity/student-attendance.entity.js';
import { TeacherAttendance } from './entity/teacher-attendance.entity.js';
import { LeaveRequest } from './entity/leave-request.entity.js';
import { LeaveRequestHook } from './attendance.hook.js';
import {
  RecordStudentAttendanceDto,
  BatchRecordStudentAttendanceDto,
  FindStudentAttendanceDto,
} from './dto/student-attendance.dto.js';
import {
  RecordTeacherAttendanceDto,
  BatchRecordTeacherAttendanceDto,
  FindTeacherAttendanceDto,
} from './dto/teacher-attendance.dto.js';
import {
  CreateLeaveRequestDto,
  UpdateLeaveRequestDto,
  ReviewLeaveRequestDto,
  FindLeaveRequestsDto,
} from './dto/leave-request.dto.js';

@ApiTags('Admin Attendance')
@ApiBearerAuth()
@Controller('admin/attendance')
export class AdminAttendanceController {
  constructor(
    private readonly studentAttendanceService: StudentAttendanceService,
    private readonly teacherAttendanceService: TeacherAttendanceService,
    private readonly leaveRequestService: LeaveRequestService,
  ) {}

  // ==================== STUDENT ATTENDANCE ====================

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN)
  @UseAbility(DefaultActions.read, StudentAttendance)
  @Get('students')
  findStudentsAttendance(@Query() dto: FindStudentAttendanceDto) {
    return this.studentAttendanceService.findAll(dto);
  }

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN)
  @UseAbility(DefaultActions.read, StudentAttendance)
  @Get('students/matrix')
  getStudentAttendanceMatrix(
    @Query('classId', ParseIntPipe) classId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.studentAttendanceService.getMatrix(classId, startDate, endDate);
  }

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN)
  @UseAbility(DefaultActions.read, StudentAttendance)
  @Get('students/summary')
  getClassAttendanceSummary(
    @Query('classId', ParseIntPipe) classId: number,
    @Query('date') date: string,
  ) {
    return this.studentAttendanceService.getClassSummary(classId, date);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.create, StudentAttendance)
  @Post('students')
  recordStudentAttendance(
    @Body() dto: RecordStudentAttendanceDto,
    @CurrentUser('sub') currentUserId: number,
  ) {
    return this.studentAttendanceService.recordAttendance(dto, currentUserId);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.create, StudentAttendance)
  @Post('students/batch')
  batchRecordStudentAttendance(
    @Body() dto: BatchRecordStudentAttendanceDto,
    @CurrentUser('sub') currentUserId: number,
  ) {
    return this.studentAttendanceService.batchRecordAttendance(
      dto,
      currentUserId,
    );
  }

  // ==================== TEACHER ATTENDANCE ====================

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN)
  @UseAbility(DefaultActions.read, TeacherAttendance)
  @Get('teachers')
  findTeachersAttendance(@Query() dto: FindTeacherAttendanceDto) {
    return this.teacherAttendanceService.findAll(dto);
  }

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN)
  @UseAbility(DefaultActions.read, TeacherAttendance)
  @Get('teachers/summary')
  getTeacherMonthlySummary(
    @Query('teacherId', ParseIntPipe) teacherId: number,
    @Query('month') month: string,
  ) {
    return this.teacherAttendanceService.getTeacherMonthlySummary(
      teacherId,
      month,
    );
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.create, TeacherAttendance)
  @Post('teachers')
  recordTeacherAttendance(
    @Body() dto: RecordTeacherAttendanceDto,
    @CurrentUser('sub') currentUserId: number,
  ) {
    return this.teacherAttendanceService.recordAttendance(dto, currentUserId);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.create, TeacherAttendance)
  @Post('teachers/batch')
  batchRecordTeacherAttendance(
    @Body() dto: BatchRecordTeacherAttendanceDto,
    @CurrentUser('sub') currentUserId: number,
  ) {
    return this.teacherAttendanceService.batchRecordAttendance(
      dto,
      currentUserId,
    );
  }

  // ==================== LEAVE REQUESTS ====================

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN)
  @UseAbility(DefaultActions.read, LeaveRequest)
  @Get('leave-requests')
  findLeaveRequests(@Query() dto: FindLeaveRequestsDto) {
    return this.leaveRequestService.findAll(dto);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.read, LeaveRequest, LeaveRequestHook)
  @Get('leave-requests/:id')
  async getLeaveRequest(@Param('id', ParseIntPipe) id: number) {
    return this.leaveRequestService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.create, LeaveRequest)
  @Post('leave-requests')
  createLeaveRequest(
    @Body() dto: CreateLeaveRequestDto,
    @CurrentUser('sub') currentUserId: number,
  ) {
    return this.leaveRequestService.create(dto, currentUserId);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.update, LeaveRequest, LeaveRequestHook)
  @Patch('leave-requests/:id')
  updateLeaveRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLeaveRequestDto,
  ) {
    return this.leaveRequestService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.delete, LeaveRequest, LeaveRequestHook)
  @Delete('leave-requests/:id')
  deleteLeaveRequest(@Param('id', ParseIntPipe) id: number) {
    return this.leaveRequestService.delete(id);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.update, LeaveRequest, LeaveRequestHook)
  @Post('leave-requests/:id/review')
  reviewLeaveRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewLeaveRequestDto,
    @CurrentUser('sub') currentUserId: number,
  ) {
    return this.leaveRequestService.review(id, dto, currentUserId);
  }
}
