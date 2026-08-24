import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from 'nest-casl';
import { GradingRule } from './entity/grading-rule.entity.js';
import { StudentScore } from './entity/student-score.entity.js';
import { Class } from '@src/academic/entity/class.entity.js';
import { Student } from '@src/student/entity/student.entity.js';
import { StudentClass } from '@src/student/entity/student-class.entity.js';
import { User } from '@src/user/entity/user.entity.js';
import { GradingRuleService } from './grading-rule.service.js';
import { ExaminationService } from './examination.service.js';
import { AdminGradingRuleController } from './admin.grading-rule.controller.js';
import { AdminExaminationController } from './admin.examination.controller.js';
import { permissions } from './examination.permission.js';
import { AuthModule } from '@src/auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GradingRule,
      StudentScore,
      Class,
      Student,
      StudentClass,
      User,
    ]),
    CaslModule.forFeature({ permissions }),
    AuthModule,
  ],
  controllers: [AdminGradingRuleController, AdminExaminationController],
  providers: [GradingRuleService, ExaminationService],
  exports: [GradingRuleService, ExaminationService, TypeOrmModule],
})
export class ExaminationModule {}
