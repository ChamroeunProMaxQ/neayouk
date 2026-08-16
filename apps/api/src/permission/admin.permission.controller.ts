import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/jwt-auth.guard.js';
import { CaslAccessGuard } from '@src/common/guard/casl-access.guard.js';
import { UserTypesGuard } from '@src/common/guard/user-types.guard.js';
import { UserTypes } from '@src/common/decorator/user-type.decorator.js';
import { UserTypeEnum } from '@repo/contracts';
import { DefaultActions, UseAbility } from 'nest-casl';
import { Permission } from './entity/permission.entity.js';
import { PermissionService } from './permission.service.js';
import { FindPermissionsDto } from './dto/find-permissions.dto.js';

@ApiBearerAuth()
@Controller('admin/permissions')
@UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
@UserTypes(UserTypeEnum.ADMIN, UserTypeEnum.CMS)
export class AdminPermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @UseAbility(DefaultActions.read, Permission)
  @Get()
  findAll(@Query() dto: FindPermissionsDto) {
    return this.permissionService.findAll(dto);
  }
}
