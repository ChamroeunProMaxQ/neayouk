import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entity/permission.entity.js';
import { Role } from '@src/role/entity/role.entity.js';
import { AdminPermissionController } from './admin.permission.controller.js';
import { PermissionService } from './permission.service.js';
import { AuthModule } from '@src/auth/auth.module.js';
import { CaslModule } from 'nest-casl';
import { permissions } from './permission.permission.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission, Role]),
    CaslModule.forFeature({ permissions }),
    AuthModule,
  ],
  controllers: [AdminPermissionController],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
