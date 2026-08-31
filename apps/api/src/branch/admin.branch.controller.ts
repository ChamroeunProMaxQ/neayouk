import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DefaultActions, UseAbility } from 'nest-casl';
import { UserTypeEnum } from '@repo/contracts';
import { JwtAuthGuard } from '@src/auth/jwt-auth.guard.js';
import { CurrentUser } from '@src/common/decorator/current-user.decorator.js';
import { UserTypes } from '@src/common/decorator/user-type.decorator.js';
import { CaslAccessGuard } from '@src/common/guard/casl-access.guard.js';
import { UserTypesGuard } from '@src/common/guard/user-types.guard.js';
import type { AuthContext } from '@src/common/helper/branch-scoping.helper.js';
import { BranchHook } from './branch.hook.js';
import { BranchService } from './branch.service.js';
import { FindBranchesDto } from './dto/find-branches.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';
import { Branch } from './entity/branch.entity.js';

@ApiTags('Admin Branches')
@ApiBearerAuth()
@Controller('admin/branches')
export class AdminBranchController {
  constructor(private readonly branchService: BranchService) {}

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN, UserTypeEnum.SUPER_ADMIN)
  @UseAbility(DefaultActions.read, Branch)
  @Get()
  findAll(
    @Query() dto: FindBranchesDto,
    @CurrentUser() currentUser: AuthContext,
  ) {
    return this.branchService.findAll(dto, currentUser);
  }

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN, UserTypeEnum.SUPER_ADMIN)
  @UseAbility(DefaultActions.read, Branch)
  @Get('current')
  getCurrentBranch(@CurrentUser() currentUser: AuthContext) {
    return this.branchService.getCurrentBranch(currentUser);
  }

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN, UserTypeEnum.SUPER_ADMIN)
  @UseAbility(DefaultActions.update, Branch)
  @Patch('current')
  updateCurrentBranch(
    @Body() dto: UpdateBranchDto,
    @CurrentUser() currentUser: AuthContext,
  ) {
    return this.branchService.updateCurrentBranch(currentUser, dto);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.read, Branch, BranchHook)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.branchService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.update, Branch, BranchHook)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchService.updateBranch(id, dto);
  }
}
