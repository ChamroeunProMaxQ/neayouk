import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from 'nest-casl';
import { Student } from './entity/student.entity.js';
import { Class } from './entity/class.entity.js';
import { StudentClass } from './entity/student-class.entity.js';
import { StudentPayment } from './entity/student-payment.entity.js';
import { StudentService } from './student.service.js';
import { StudentPaymentService } from './student-payment.service.js';
import { ClassService } from './class.service.js';
import { AdminStudentController } from './admin.student.controller.js';
import { AdminClassController } from './admin.class.controller.js';
import { permissions } from './student.permission.js';
import { AuthModule } from '@src/auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Class, StudentClass, StudentPayment]),
    CaslModule.forFeature({ permissions }),
    AuthModule,
  ],
  controllers: [AdminStudentController, AdminClassController],
  providers: [StudentService, StudentPaymentService, ClassService],
  exports: [StudentService, StudentPaymentService, ClassService],
})
export class StudentModule {}
