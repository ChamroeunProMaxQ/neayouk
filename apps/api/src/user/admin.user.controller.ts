import { Body, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserTypeEnum } from '@repo/contracts';
import type { Request } from 'express';
import { UserTypes } from '@src/common/decorator/user-type.decorator.js';
import { JwtAuthGuard } from '@src/auth/jwt-auth.guard.js';
import { UserTypesGuard } from '@src/common/guard/user-types.guard.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import { UserService } from './user.service.js';

export class AdminUserController {
  constructor(private readonly userService: UserService) {
    //
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, UserTypesGuard)
  @UserTypes(UserTypeEnum.ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto, @Req() req: Request) {
    return this.userService.createUser(dto, req.user?.sub!);
  }
}
