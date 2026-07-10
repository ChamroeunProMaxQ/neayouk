import { Body, Controller, Post, Req } from '@nestjs/common';
import { CreateUserDto } from './create-user.dto.js';
import { UserService } from './user.service.js';

@Controller('/api/v1/users')
export class UserController {
  // Controller methods will go here
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() dto: CreateUserDto, @Req() req: Request) {
    const userId = 17; // Assuming you have user information in the request
    return this.userService.createUser(dto, userId);
  }
}
