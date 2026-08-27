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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DefaultActions, UseAbility } from 'nest-casl';
import { UserTypeEnum } from '@repo/contracts';
import { JwtAuthGuard } from '@src/auth/jwt-auth.guard.js';
import { CaslAccessGuard } from '@src/common/guard/casl-access.guard.js';
import { UserTypesGuard } from '@src/common/guard/user-types.guard.js';
import { UserTypes } from '@src/common/decorator/user-type.decorator.js';
import { CurrentUser } from '@src/common/decorator/current-user.decorator.js';
import { HttpMessage } from '@src/common/decorator/message.decorator.js';
import { StaffService } from './staff.service.js';
import { Staff } from './entity/staff.entity.js';
import { StaffHook } from './hr.hook.js';
import { CreateStaffDto, FindStaffDto, UpdateStaffDto } from './dto/staff.dto.js';

@ApiTags('Admin HR Staff')
@ApiBearerAuth()
@Controller('admin/hr/staff')
export class AdminStaffController {
  constructor(private readonly staffService: StaffService) {}

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN)
  @UseAbility(DefaultActions.read, Staff)
  @Get()
  @HttpMessage('Staff list retrieved successfully')
  findAll(@Query() dto: FindStaffDto) {
    return this.staffService.findAll(dto);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.read, Staff, StaffHook)
  @Get(':id')
  @HttpMessage('Staff details retrieved successfully')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.create, Staff)
  @Post()
  @HttpMessage('Staff created successfully')
  create(
    @Body() dto: CreateStaffDto,
    @CurrentUser('sub') currentUserId: number,
  ) {
    return this.staffService.create(dto, currentUserId);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.update, Staff, StaffHook)
  @Patch(':id')
  @HttpMessage('Staff updated successfully')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStaffDto,
    @CurrentUser('sub') currentUserId: number,
  ) {
    return this.staffService.update(id, dto, currentUserId);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.delete, Staff, StaffHook)
  @Delete(':id')
  @HttpMessage('Staff deleted successfully')
  delete(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') currentUserId: number) {
    return this.staffService.remove(id, currentUserId);
  }
}
