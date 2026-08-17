import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from 'nest-casl';
import { Teacher } from './entity/teacher.entity.js';
import { User } from '@src/user/entity/user.entity.js';
import { Role } from '@src/role/entity/role.entity.js';
import { Class } from '@src/academic/entity/class.entity.js';
import { TeacherService } from './teacher.service.js';
import { TeacherHook } from './teacher.hook.js';
import { AdminTeacherController } from './admin.teacher.controller.js';
import { permissions } from './teacher.permission.js';
import { AuthModule } from '@src/auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Teacher, User, Role, Class]),
    CaslModule.forFeature({ permissions }),
    AuthModule,
  ],
  controllers: [AdminTeacherController],
  providers: [TeacherService, TeacherHook],
  exports: [TeacherService, TypeOrmModule],
})
export class TeacherModule {}
