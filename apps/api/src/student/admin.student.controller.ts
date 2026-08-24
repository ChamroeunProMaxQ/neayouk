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
import { StudentService } from './student.service.js';
import { StudentPaymentService } from './student-payment.service.js';
import { Student } from './entity/student.entity.js';
import { StudentPayment } from './entity/student-payment.entity.js';
import {
  CreateStudentDto,
  UpdateStudentDto,
} from './dto/create-student.dto.js';
import { FindStudentsDto } from './dto/find-students.dto.js';
import {
  AssignStudentClassesDto,
  PromoteStudentDto,
  BatchPromoteStudentsDto,
} from '@src/academic/dto/class.dto.js';
import {
  RecordPaymentDto,
  BatchRecordPaymentDto,
  FindStudentPaymentsDto,
} from './dto/student-payment.dto.js';

@ApiTags('Admin Students')
@ApiBearerAuth()
@Controller('admin/students')
export class AdminStudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly paymentService: StudentPaymentService,
  ) {}

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN)
  @UseAbility(DefaultActions.read, Student)
  @Get()
  findAll(@Query() dto: FindStudentsDto) {
    return this.studentService.findAll(dto);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.read, Student)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.read, Student)
  @Get(':id/summary')
  getSummary(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.getStudentPaymentSummary(id);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.create, Student)
  @Post()
  create(
    @Body() dto: CreateStudentDto,
    @CurrentUser('sub') currentUserId: number,
  ) {
    return this.studentService.create(dto, currentUserId);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.update, Student)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentDto,
    @CurrentUser('sub') currentUserId: number,
  ) {
    return this.studentService.update(id, dto, currentUserId);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.delete, Student)
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.studentService.delete(id);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.update, Student)
  @Post(':id/classes')
  assignClasses(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignStudentClassesDto,
  ) {
    return this.studentService.assignClasses(id, dto);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.update, Student)
  @Post(':id/promote')
  promote(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PromoteStudentDto,
  ) {
    return this.studentService.promoteStudent({ ...dto, studentId: id });
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.update, Student)
  @Post('batch-promote')
  batchPromote(@Body() dto: BatchPromoteStudentsDto) {
    return this.studentService.batchPromoteStudents(dto);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.read, StudentPayment)
  @Get(':id/payments')
  findPayments(
    @Param('id', ParseIntPipe) id: number,
    @Query() dto: FindStudentPaymentsDto,
  ) {
    return this.paymentService.findPayments(id, dto);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.create, StudentPayment)
  @Post(':id/payments')
  recordPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordPaymentDto,
    @CurrentUser('sub') currentUserId: number,
  ) {
    return this.paymentService.recordPayment(
      { ...dto, studentId: id },
      currentUserId,
    );
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.create, StudentPayment)
  @Post(':id/batch-payments')
  recordBatchPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BatchRecordPaymentDto,
    @CurrentUser('sub') currentUserId: number,
  ) {
    return this.paymentService.recordBatchPayment(
      { ...dto, studentId: id },
      currentUserId,
    );
  }
}
