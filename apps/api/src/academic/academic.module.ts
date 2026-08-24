import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from 'nest-casl';
import { Class } from './entity/class.entity.js';
import { Program } from './entity/program.entity.js';
import { ClassTimetable } from './entity/class-timetable.entity.js';
import { StudentClass } from '@src/student/entity/student-class.entity.js';
import { ClassService } from './class.service.js';
import { ProgramService } from './program.service.js';
import { AdminClassController } from './admin.class.controller.js';
import { AdminProgramController } from './admin.program.controller.js';
import { permissions } from './academic.permission.js';
import { AuthModule } from '@src/auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Class, Program, ClassTimetable, StudentClass]),
    CaslModule.forFeature({ permissions }),
    AuthModule,
  ],
  controllers: [AdminClassController, AdminProgramController],
  providers: [ClassService, ProgramService],
  exports: [ClassService, ProgramService, TypeOrmModule],
})
export class AcademicModule {}
