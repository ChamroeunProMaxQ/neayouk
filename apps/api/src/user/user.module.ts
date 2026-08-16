import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@src/auth/auth.module.js';
import { User } from './entity/user.entity.js';
import { Role } from '@src/role/entity/role.entity.js';
import { Permission } from '@src/permission/entity/permission.entity.js';
import { AdminUserController } from './admin.user.controller.js';
import { UserService } from './user.service.js';
import { CaslModule } from 'nest-casl';
import { permissions } from './user.permission.js';
import { UserHook } from './user.hook.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission]),
    CaslModule.forFeature({ permissions }),
    AuthModule,
  ],
  controllers: [AdminUserController],
  providers: [UserService, UserHook],
  exports: [UserService],
})
export class UserModule {}
