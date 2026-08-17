import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from 'nest-casl';
import { Student } from './entity/student.entity.js';
import { StudentClass } from './entity/student-class.entity.js';
import { StudentPayment } from './entity/student-payment.entity.js';
import { Class } from '@src/academic/entity/class.entity.js';
import { StudentService } from './student.service.js';
import { StudentPaymentService } from './student-payment.service.js';
import { AdminStudentController } from './admin.student.controller.js';
import { permissions } from './student.permission.js';
import { AuthModule } from '@src/auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, StudentClass, StudentPayment, Class]),
    CaslModule.forFeature({ permissions }),
    AuthModule,
  ],
  controllers: [AdminStudentController],
  providers: [StudentService, StudentPaymentService],
  exports: [StudentService, StudentPaymentService],
})
export class StudentModule {}
