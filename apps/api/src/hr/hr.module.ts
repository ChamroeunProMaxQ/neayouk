import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from 'nest-casl';
import { Staff } from './entity/staff.entity.js';
import { Payroll } from './entity/payroll.entity.js';
import { PayrollItem } from './entity/payroll-item.entity.js';
import { User } from '@src/user/entity/user.entity.js';
import { Role } from '@src/role/entity/role.entity.js';
import { Class } from '@src/academic/entity/class.entity.js';
import { TeacherAttendance } from '@src/attendance/entity/teacher-attendance.entity.js';
import { SchoolExpense } from '@src/fee/entity/school-expense.entity.js';
import { StaffService } from './staff.service.js';
import { PayrollService } from './payroll.service.js';
import { AdminStaffController } from './admin.staff.controller.js';
import { AdminPayrollController } from './admin.payroll.controller.js';
import { StaffHook, PayrollHook } from './hr.hook.js';
import { permissions } from './hr.permission.js';
import { AuthModule } from '@src/auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Staff,
      Payroll,
      PayrollItem,
      User,
      Role,
      Class,
      TeacherAttendance,
      SchoolExpense,
    ]),
    CaslModule.forFeature({ permissions }),
    AuthModule,
  ],
  controllers: [AdminStaffController, AdminPayrollController],
  providers: [StaffService, PayrollService, StaffHook, PayrollHook],
  exports: [StaffService, PayrollService],
})
export class HrModule {}
