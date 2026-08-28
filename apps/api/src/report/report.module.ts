import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from 'nest-casl';
import { StudentPayment } from '@src/student/entity/student-payment.entity.js';
import { PaymentItem } from '@src/student/entity/payment-item.entity.js';
import { SchoolExpense } from '@src/fee/entity/school-expense.entity.js';
import { Payroll } from '@src/hr/entity/payroll.entity.js';
import { StudentScore } from '@src/examination/entity/student-score.entity.js';
import { Class } from '@src/academic/entity/class.entity.js';
import { Student } from '@src/student/entity/student.entity.js';
import { GradingRule } from '@src/examination/entity/grading-rule.entity.js';
import { StudentClass } from '@src/student/entity/student-class.entity.js';
import { StudentAttendance } from '@src/attendance/entity/student-attendance.entity.js';
import { TeacherAttendance } from '@src/attendance/entity/teacher-attendance.entity.js';
import { LeaveRequest } from '@src/attendance/entity/leave-request.entity.js';

import { FinancialReportService } from './financial-report.service.js';
import { AcademicReportService } from './academic-report.service.js';
import { AttendanceReportService } from './attendance-report.service.js';
import { AdminReportController } from './admin.report.controller.js';
import { permissions } from './report.permission.js';
import { AuthModule } from '@src/auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentPayment,
      PaymentItem,
      SchoolExpense,
      Payroll,
      StudentScore,
      Class,
      Student,
      GradingRule,
      StudentClass,
      StudentAttendance,
      TeacherAttendance,
      LeaveRequest,
    ]),
    CaslModule.forFeature({ permissions }),
    AuthModule,
  ],
  controllers: [AdminReportController],
  providers: [
    FinancialReportService,
    AcademicReportService,
    AttendanceReportService,
  ],
  exports: [
    FinancialReportService,
    AcademicReportService,
    AttendanceReportService,
  ],
})
export class ReportModule {}
