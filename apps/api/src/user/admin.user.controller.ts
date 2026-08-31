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
import { CreateUserDto } from './dto/create-user.dto.js';
import { FindUsersDto } from './dto/find-users.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserService } from './user.service.js';
import { DefaultActions, UseAbility } from 'nest-casl';
import { JwtAuthGuard } from '@src/auth/jwt-auth.guard.js';
import { CaslAccessGuard } from '@src/common/guard/casl-access.guard.js';
import { User } from './entity/user.entity.js';
import { UserHook } from './user.hook.js';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserTypes } from '@src/common/decorator/user-type.decorator.js';
import { UserTypeEnum } from '@repo/contracts';
import { UserTypesGuard } from '@src/common/guard/user-types.guard.js';
import { CurrentUser } from '@src/common/decorator/current-user.decorator.js';

@ApiBearerAuth()
@Controller('admin/users')
export class AdminUserController {
  constructor(private readonly userService: UserService) {
    //
  }

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN, UserTypeEnum.SUPER_ADMIN)
  @UseAbility(DefaultActions.read, User)
  @Get()
  findAll(
    @Query() dto: FindUsersDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.userService.findAll(dto, currentUser);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.read, User, UserHook)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.create, User)
  @Post()
  create(
    @Body() dto: CreateUserDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.userService.createUser(dto, currentUser);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.update, User, UserHook)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser('sub') currentUserId: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.userService.updateUser(id, dto, currentUserId, currentUser);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.delete, User, UserHook)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deleteUser(id);
  }
}
