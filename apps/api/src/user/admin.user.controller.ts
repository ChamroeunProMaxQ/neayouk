import { Body, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserTypeEnum } from '@repo/shared';
import type { Request } from 'express';
import { UserTypes } from '../common/decorator/user-type.decorator.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import { UserService } from './user.service.js';

export class AdminUserController {
  constructor(private readonly userService: UserService) {
    //
  }

  @ApiBearerAuth()
  @UserTypes(UserTypeEnum.ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto, @Req() req: Request) {
    return this.userService.createUser(dto, req.user?.sub!);
  }
}
