import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entity/role.entity.js';
import { Permission } from '@src/permission/entity/permission.entity.js';
import { AdminRoleController } from './admin.role.controller.js';
import { RoleService } from './role.service.js';
import { CaslModule } from 'nest-casl';
import { permissions } from './role.permission.js';
import { AuthModule } from '@src/auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission]),
    CaslModule.forFeature({ permissions }),
    AuthModule,
  ],
  controllers: [AdminRoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
