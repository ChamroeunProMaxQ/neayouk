import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from 'nest-casl';
import { StudentAttendance } from './entity/student-attendance.entity.js';
import { TeacherAttendance } from './entity/teacher-attendance.entity.js';
import { LeaveRequest } from './entity/leave-request.entity.js';
import { Student } from '@src/student/entity/student.entity.js';
import { Class } from '@src/academic/entity/class.entity.js';
import { StudentClass } from '@src/student/entity/student-class.entity.js';
import { Teacher } from '@src/teacher/entity/teacher.entity.js';
import { User } from '@src/user/entity/user.entity.js';
import { ClassTimetable } from '@src/academic/entity/class-timetable.entity.js';
import { StudentAttendanceService } from './student-attendance.service.js';
import { TeacherAttendanceService } from './teacher-attendance.service.js';
import { LeaveRequestService } from './leave-request.service.js';
import { LeaveRequestHook } from './attendance.hook.js';
import { AdminAttendanceController } from './admin.attendance.controller.js';
import { permissions } from './attendance.permission.js';
import { AuthModule } from '@src/auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentAttendance,
      TeacherAttendance,
      LeaveRequest,
      Student,
      Class,
      StudentClass,
      Teacher,
      User,
      ClassTimetable,
    ]),
    CaslModule.forFeature({ permissions }),
    AuthModule,
  ],
  controllers: [AdminAttendanceController],
  providers: [
    StudentAttendanceService,
    TeacherAttendanceService,
    LeaveRequestService,
    LeaveRequestHook,
  ],
  exports: [
    StudentAttendanceService,
    TeacherAttendanceService,
    LeaveRequestService,
    TypeOrmModule,
  ],
})
export class AttendanceModule {}
