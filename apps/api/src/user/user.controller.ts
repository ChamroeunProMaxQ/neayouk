import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { CreateUserDto } from './create-user.dto.js';
import { UserService } from './user.service.js';

@Controller('/api/v1/users')
export class UserController {
  // Controller methods will go here
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto, @Req() req: Request) {
    const userId = 17; // Assuming you have user information in the request
    return this.userService.createUser(dto, userId);
  }
}
