import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from 'nest-casl';
import { AuthModule } from '@src/auth/auth.module.js';
import { Role } from '@src/role/entity/role.entity.js';
import { User } from '@src/user/entity/user.entity.js';
import { permissions } from './branch.permission.js';
import { BranchService } from './branch.service.js';
import { Branch } from './entity/branch.entity.js';
import { SuperAdminBranchController } from './superadmin.branch.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Branch, User, Role]),
    CaslModule.forFeature({ permissions }),
    AuthModule,
  ],
  controllers: [SuperAdminBranchController],
  providers: [BranchService],
  exports: [BranchService],
})
export class BranchModule {}
