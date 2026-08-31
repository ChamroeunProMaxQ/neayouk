import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DefaultActions, UseAbility } from 'nest-casl';
import { UserTypeEnum } from '@repo/contracts';
import { JwtAuthGuard } from '@src/auth/jwt-auth.guard.js';
import { UserTypes } from '@src/common/decorator/user-type.decorator.js';
import { CaslAccessGuard } from '@src/common/guard/casl-access.guard.js';
import { UserTypesGuard } from '@src/common/guard/user-types.guard.js';
import { BranchService } from './branch.service.js';
import { CreateBranchWithAdminDto } from './dto/create-branch-with-admin.dto.js';
import { FindBranchesDto } from './dto/find-branches.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';
import { Branch } from './entity/branch.entity.js';

@ApiTags('SuperAdmin Branches')
@ApiBearerAuth()
@Controller('superadmin/branches')
export class SuperAdminBranchController {
  constructor(private readonly branchService: BranchService) {}

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.SUPER_ADMIN)
  @UseAbility(DefaultActions.create, Branch)
  @Post()
  create(@Body() dto: CreateBranchWithAdminDto) {
    return this.branchService.createBranchWithAdmin(dto);
  }

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.SUPER_ADMIN)
  @UseAbility(DefaultActions.read, Branch)
  @Get()
  findAll(@Query() dto: FindBranchesDto) {
    return this.branchService.findAll(dto);
  }

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.SUPER_ADMIN)
  @UseAbility(DefaultActions.read, Branch)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.branchService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.SUPER_ADMIN)
  @UseAbility(DefaultActions.update, Branch)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchService.updateBranch(id, dto);
  }
}
