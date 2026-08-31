import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/jwt-auth.guard.js';
import { CaslAccessGuard } from '@src/common/guard/casl-access.guard.js';
import { UserTypesGuard } from '@src/common/guard/user-types.guard.js';
import { UserTypes } from '@src/common/decorator/user-type.decorator.js';
import { UserTypeEnum } from '@repo/contracts';
import { DefaultActions, UseAbility } from 'nest-casl';
import { Role } from './entity/role.entity.js';
import { RoleService } from './role.service.js';
import { FindRolesDto } from './dto/find-roles.dto.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';

import { CurrentUser } from '@src/common/decorator/current-user.decorator.js';

@ApiBearerAuth()
@Controller('admin/roles')
@UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
@UserTypes(UserTypeEnum.ADMIN, UserTypeEnum.CMS, UserTypeEnum.SUPER_ADMIN)
export class AdminRoleController {
  constructor(private readonly roleService: RoleService) {}

  @UseAbility(DefaultActions.read, Role)
  @Get()
  findAll(
    @Query() dto: FindRolesDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.roleService.findAll(dto, currentUser);
  }

  @UseAbility(DefaultActions.read, Role)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.findOne(id);
  }

  @UseAbility(DefaultActions.create, Role)
  @Post()
  create(
    @Body() dto: CreateRoleDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.roleService.create(dto, currentUser);
  }

  @UseAbility(DefaultActions.update, Role)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.roleService.update(id, dto);
  }

  @UseAbility(DefaultActions.delete, Role)
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.delete(id);
  }
}
