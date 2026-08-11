import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CreateUserDto } from './dto/create-user.dto.js';
import { FindUsersDto } from './dto/find-users.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserService } from './user.service.js';
import { AccessGuard, DefaultActions, UseAbility } from 'nest-casl';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CaslAccessGuard } from '../common/guard/casl-access.guard.js';
import { User } from './model/user.model.js';
import { UserHook } from './user.hook.js';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('/api/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {
    //
  }


  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.read, User)
  @Get()
  findAll(@Query() dto: FindUsersDto) {
    return this.userService.findAll(dto);
  }

  @UseGuards(JwtAuthGuard, AccessGuard)
  @UseAbility(DefaultActions.read, User, UserHook)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    throw new NotFoundException('not found')
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.create, User)
  @Post()
  create(@Body() dto: CreateUserDto, @Req() req: Request) {
    return this.userService.createUser(dto, req.user!.sub);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.update, User, UserHook)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @Req() req: Request,
  ) {
    return this.userService.updateUser(id, dto, req.user?.sub!);
  }
}
